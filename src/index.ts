import { program } from './cli/commands.js';
import { config } from './config/config.js';
import { botLogger } from './utils/logger.js';
import { webServer } from './web/server.js';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  botLogger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  botLogger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Graceful shutdown
let shuttingDown = false;

async function shutdownHandler() {
  if (shuttingDown) return;
  shuttingDown = true;

  botLogger.info('⚠️  Received shutdown signal, cleaning up...');

  // Force exit fallback
  const FORCE_EXIT_TIMEOUT = 10_000;
  setTimeout(() => {
    botLogger.error('⏰ Forced exit after timeout.');
    process.exit(1);
  }, FORCE_EXIT_TIMEOUT);

  try {
    const { tokenMonitor } = await import('./services/monitor.js');
    if (tokenMonitor.isActive()) {
      await tokenMonitor.stopMonitoring();
    }

    if (config.enableWebUI) {
      await webServer.stop();
    }

    botLogger.info('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    botLogger.error('❌ Error during shutdown', { error });
    process.exit(1);
  }
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, shutdownHandler);
});


// Display startup banner
console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    SOLANA TOKEN SNIPER BOT                  ║
║                      v1.0.0 - Production                    ║
║                                                              ║
║  ⚠️  WARNING: This bot involves significant financial risk    ║
║      Only use funds you can afford to lose completely       ║
║      Always verify token security before trading            ║
╚══════════════════════════════════════════════════════════════╝
`);

// Start the CLI
program.parse();