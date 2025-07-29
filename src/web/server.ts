import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { config } from '../config/config.js';
import { tokenMonitor } from '../services/monitor.js';
import { connectionManager } from '../services/connection.js';
import { webLogger } from '../utils/logger.js';

export class WebServer {
  private app: express.Application;
  private server: ReturnType<typeof createServer>;
  private io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    // this.app.use(express.static(path.join(process.cwd(), 'src/web/public')));
    this.app.use(express.static(path.join(process.cwd(), 'src/web/vite-ui/dist')));
  }

  private setupRoutes(): void {
    // API Routes
    this.app.get('/api/status', (req, res) => {
      res.json({
        isMonitoring: tokenMonitor.isActive(),
        balance: 0, // Placeholder
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('/api/monitoring', (req, res) => {
      res.json(tokenMonitor.getMonitoringData());
    });

    this.app.get('/api/config', (req, res) => {
      res.json({
        maxBuyAmountSol: config.maxBuyAmountSol,
        minLiquiditySol: config.minLiquiditySol,
        maxSlippagePercent: config.maxSlippagePercent,
        autoSellEnabled: config.autoSellEnabled,
        takeProfitPercent: config.takeProfitPercent,
        stopLossPercent: config.stopLossPercent
      });
    });

    this.app.post('/api/start', (req, res) => {
      if (!tokenMonitor.isActive()) {
        tokenMonitor.startMonitoring()
          .then(() => {
            res.json({ success: true, message: 'Monitoring started' });
          })
          .catch(error => {
            res.status(500).json({ success: false, error: error.message });
          });
      } else {
        res.json({ success: false, message: 'Already monitoring' });
      }
    });

    this.app.post('/api/stop', (req, res) => {
      if (tokenMonitor.isActive()) {
        tokenMonitor.stopMonitoring()
          .then(() => {
            res.json({ success: true, message: 'Monitoring stopped' });
          })
          .catch(error => {
            res.status(500).json({ success: false, error: error.message });
          });
      } else {
        res.json({ success: false, message: 'Not currently monitoring' });
      }
    });

    // Serve main UI
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'src/web/vite-ui/dist/index.html'));
    });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      webLogger.info('Client connected', { socketId: socket.id });

      // Send initial data
      socket.emit('monitoringData', tokenMonitor.getMonitoringData());

      // Handle client events
      socket.on('requestUpdate', () => {
        socket.emit('monitoringData', tokenMonitor.getMonitoringData());
      });

      socket.on('disconnect', () => {
        webLogger.info('Client disconnected', { socketId: socket.id });
      });
    });

    // Listen for monitoring updates and broadcast to clients
    tokenMonitor.on('monitoringUpdate', (data) => {
      this.io.emit('monitoringData', data);
    });

    tokenMonitor.on('newToken', (tokenInfo) => {
      this.io.emit('newToken', {
        mint: tokenInfo.mint.toString(),
        symbol: tokenInfo.symbol,
        timestamp: tokenInfo.createdAt
      });
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(config.webPort, () => {
        webLogger.info(`Web server started on port ${config.webPort}`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        webLogger.info('Web server stopped');
        resolve();
      });
    });
  }
}

export const webServer = new WebServer();