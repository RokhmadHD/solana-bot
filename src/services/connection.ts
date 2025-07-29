import { Connection, Commitment } from '@solana/web3.js';
import { config } from '../config/config.js';
import { botLogger } from '../utils/logger.js';

class ConnectionManager {
  private connection: Connection;
  private wsConnection: Connection;
  private lastHealthCheck: Date = new Date();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connection = new Connection(config.rpcUrl, {
      commitment: config.commitment as Commitment,
      confirmTransactionInitialTimeout: config.rpcTimeoutMs,
    });

    this.wsConnection = new Connection(config.rpcUrl, {
      commitment: config.commitment as Commitment,
      wsEndpoint: config.wssUrl,
    });

    this.startHealthCheck();
    botLogger.info('Connection manager initialized', {
      rpcUrl: config.rpcUrl,
      wssUrl: config.wssUrl,
      commitment: config.commitment
    });
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const slot = await this.connection.getSlot();
        this.lastHealthCheck = new Date();
        botLogger.debug('RPC health check passed', { slot });
      } catch (error) {
        botLogger.error('RPC health check failed', { error });
        // Implement reconnection logic if needed
        this.reconnect();
      }
    }, 30000); // Check every 30 seconds
  }

  private async reconnect(): Promise<void> {
    botLogger.info('Attempting to reconnect to RPC...');
    
    try {
      this.connection = new Connection(config.rpcUrl, {
        commitment: config.commitment as Commitment,
        confirmTransactionInitialTimeout: config.rpcTimeoutMs,
      });

      this.wsConnection = new Connection(config.wssUrl, {
        commitment: config.commitment as Commitment,
        wsEndpoint: config.wssUrl,
      });

      // Test connection
      await this.connection.getSlot();
      botLogger.info('Successfully reconnected to RPC');
    } catch (error) {
      botLogger.error('Failed to reconnect to RPC', { error });
      throw error;
    }
  }

  public getConnection(): Connection {
    return this.connection;
  }

  public getWsConnection(): Connection {
    return this.wsConnection;
  }

  public getLastHealthCheck(): Date {
    return this.lastHealthCheck;
  }

  public async getBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(config.walletKeypair.publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      botLogger.error('Failed to get wallet balance', { error });
      throw error;
    }
  }

  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    botLogger.info('Connection manager destroyed');
  }
}

export const connectionManager = new ConnectionManager();