import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { config } from '../config/config.js';
import { tokenMonitor } from '../services/monitor.js';
import { connectionManager } from '../services/connection.js';
import { botLogger } from '../utils/logger.js';

const program = new Command();

program
  .name('solana-sniper')
  .description('Advanced Solana token sniper bot')
  .version('1.0.0');

program
  .command('start')
  .description('Start the token sniper bot')
  .option('-w, --web', 'Start with web interface')
  .option('-d, --daemon', 'Run in daemon mode')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Starting Solana Token Sniper Bot'));
    
    try {
      // Display configuration
      await displayConfig();
      
      // Start monitoring
      await tokenMonitor.startMonitoring();
      console.log(chalk.green('✅ Token monitoring started'));
      
      if (options.web) {
        const { webServer } = await import('../web/server.js');
        await webServer.start();
        console.log(chalk.green(`🌐 Web interface available at http://localhost:${config.webPort}`));
      }
      
      if (!options.daemon) {
        // Interactive mode
        await runInteractiveMode();
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to start bot:'), error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check bot status')
  .action(async () => {
    try {
      const balance = await connectionManager.getBalance();
      const isMonitoring = tokenMonitor.isActive();
      const monitoringData = tokenMonitor.getMonitoringData();
      
      console.log(chalk.blue('\n📊 Bot Status\n'));
      console.log(`Monitoring: ${isMonitoring ? chalk.green('Active') : chalk.red('Inactive')}`);
      console.log(`Wallet Balance: ${chalk.yellow(balance.toFixed(4))} SOL`);
      console.log(`Total Attempts: ${monitoringData.totalSnipeAttempts}`);
      console.log(`Successful Snipes: ${chalk.green(monitoringData.successfulSnipes)}`);
      console.log(`Failed Snipes: ${chalk.red(monitoringData.failedSnipes)}`);
      console.log(`Total P&L: ${monitoringData.totalProfitLoss >= 0 ? chalk.green('+') : chalk.red('')}${monitoringData.totalProfitLoss.toFixed(4)} SOL`);
      console.log(`Active Positions: ${monitoringData.activePositions.length}`);
      console.log(`Uptime: ${Math.floor(monitoringData.uptime / 1000 / 60)} minutes\n`);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to get status:'), error);
    }
  });

program
  .command('config')
  .description('View current configuration')
  .action(async () => {
    await displayConfig();
  });

program
  .command('test')
  .description('Test bot connections and configuration')
  .action(async () => {
    console.log(chalk.blue('🧪 Running connection tests...\n'));
    
    try {
      // Test RPC connection
      console.log('Testing RPC connection...');
      const slot = await connectionManager.getConnection().getSlot();
      console.log(chalk.green(`✅ RPC connection successful (slot: ${slot})`));
      
      // Test wallet balance
      console.log('Checking wallet balance...');
      const balance = await connectionManager.getBalance();
      console.log(chalk.green(`✅ Wallet balance: ${balance.toFixed(4)} SOL`));
      
      if (balance < config.maxBuyAmountSol) {
        console.log(chalk.yellow(`⚠️  Warning: Wallet balance is below max buy amount`));
      }
      
      // Test Telegram (if enabled)
      if (config.enableTelegram) {
        console.log('Testing Telegram notifications...');
        const { notificationService } = await import('../services/notifications.js');
        await notificationService.sendMessage('🧪 Test message from Solana Sniper Bot');
        console.log(chalk.green('✅ Telegram test message sent'));
      }
      
      console.log(chalk.green('\n✅ All tests passed!'));
      
    } catch (error) {
      console.error(chalk.red('❌ Test failed:'), error);
    }
  });

async function displayConfig(): Promise<void> {
  console.log(chalk.blue('\n⚙️  Current Configuration\n'));
  console.log(`RPC URL: ${config.rpcUrl}`);
  console.log(`Wallet: ${config.walletKeypair.publicKey.toString()}`);
  console.log(`Max Buy Amount: ${config.maxBuyAmountSol} SOL`);
  console.log(`Min Liquidity: ${config.minLiquiditySol} SOL`);
  console.log(`Max Slippage: ${config.maxSlippagePercent}%`);
  console.log(`Priority Fee: ${config.priorityFeeLamports} lamports`);
  console.log(`Snipe Delay: ${config.snipeDelayMs}ms`);
  console.log(`Auto Sell: ${config.autoSellEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`Take Profit: ${config.takeProfitPercent}%`);
  console.log(`Stop Loss: ${config.stopLossPercent}%`);
  console.log(`Telegram: ${config.enableTelegram ? 'Enabled' : 'Disabled'}`);
  console.log(`Web UI: ${config.enableWebUI ? `Enabled (port ${config.webPort})` : 'Disabled'}\n`);
}

async function runInteractiveMode(): Promise<void> {
  console.log(chalk.green('\n🎯 Interactive Mode - Type "help" for commands\n'));
  
  while (true) {
    try {
      const { command } = await inquirer.prompt([
        {
          type: 'input',
          name: 'command',
          message: chalk.cyan('sniper>')
        }
      ]);
      
      const cmd = command.toLowerCase().trim();
      
      switch (cmd) {
        case 'help':
          showHelp();
          break;
        case 'status':
          await showStatus();
          break;
        case 'stop':
          await tokenMonitor.stopMonitoring();
          console.log(chalk.yellow('⏹️  Monitoring stopped'));
          break;
        case 'start':
          await tokenMonitor.startMonitoring();
          console.log(chalk.green('▶️  Monitoring started'));
          break;
        case 'balance':
          const balance = await connectionManager.getBalance();
          console.log(`Wallet balance: ${chalk.yellow(balance.toFixed(4))} SOL`);
          break;
        case 'positions':
          showPositions();
          break;
        case 'exit':
        case 'quit':
          console.log(chalk.blue('👋 Goodbye!'));
          process.exit(0);
          break;
        default:
          if (cmd) {
            console.log(chalk.red(`Unknown command: ${cmd}. Type "help" for available commands.`));
          }
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error);
    }
  }
}

function showHelp(): void {
  console.log(chalk.blue('\n📋 Available Commands:\n'));
  console.log('  help      - Show this help message');
  console.log('  status    - Show bot status');
  console.log('  start     - Start monitoring');
  console.log('  stop      - Stop monitoring');
  console.log('  balance   - Show wallet balance');
  console.log('  positions - Show active positions');
  console.log('  exit      - Exit the bot\n');
}

async function showStatus(): Promise<void> {
  const isMonitoring = tokenMonitor.isActive();
  const data = tokenMonitor.getMonitoringData();
  
  console.log(chalk.blue('\n📊 Current Status:\n'));
  console.log(`Monitoring: ${isMonitoring ? chalk.green('Active') : chalk.red('Inactive')}`);
  console.log(`Total Attempts: ${data.totalSnipeAttempts}`);
  console.log(`Success Rate: ${data.totalSnipeAttempts > 0 ? ((data.successfulSnipes / data.totalSnipeAttempts) * 100).toFixed(1) : 0}%`);
  console.log(`Total P&L: ${data.totalProfitLoss >= 0 ? chalk.green('+') : chalk.red('')}${data.totalProfitLoss.toFixed(4)} SOL`);
  console.log(`Active Positions: ${data.activePositions.length}\n`);
}

function showPositions(): void {
  const data = tokenMonitor.getMonitoringData();
  
  if (data.activePositions.length === 0) {
    console.log(chalk.yellow('📝 No active positions\n'));
    return;
  }
  
  console.log(chalk.blue('\n💼 Active Positions:\n'));
  data.activePositions.forEach((position, index) => {
    const pnl = position.profitLossPercent || 0;
    const pnlColor = pnl >= 0 ? chalk.green : chalk.red;
    
    console.log(`${index + 1}. ${position.tokenMint.toString().slice(0, 8)}...`);
    console.log(`   Cost: ${position.costBasisSol} SOL`);
    console.log(`   P&L: ${pnlColor(pnl.toFixed(2) + '%')}`);
    console.log();
  });
}

export { program };