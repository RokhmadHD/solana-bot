import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/config.js';
import { botLogger } from '../utils/logger.js';

class NotificationService {
  private telegramBot: TelegramBot | null = null;

  constructor() {
    if (config.enableTelegram && config.telegramBotToken) {
      this.initializeTelegram();
    }
  }

  private initializeTelegram(): void {
    try {
      this.telegramBot = new TelegramBot(config.telegramBotToken!, { polling: false });
      botLogger.info('Telegram bot initialized');
    } catch (error) {
      botLogger.error('Failed to initialize Telegram bot', { error });
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!config.enableTelegram || !this.telegramBot || !config.telegramChatId) {
      return;
    }

    try {
      await this.telegramBot.sendMessage(config.telegramChatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
      
      botLogger.debug('Telegram message sent', { message: message.substring(0, 50) });
    } catch (error) {
      botLogger.error('Failed to send Telegram message', { error });
    }
  }

  async sendAlert(title: string, message: string, severity: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    const emoji = severity === 'error' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
    const formattedMessage = `${emoji} <b>${title}</b>\n\n${message}`;
    
    await this.sendMessage(formattedMessage);
  }

  async sendSnipeResult(tokenSymbol: string, success: boolean, amount?: number, error?: string): Promise<void> {
    const emoji = success ? '✅' : '❌';
    const action = success ? 'Successfully sniped' : 'Failed to snipe';
    const amountText = amount ? ` for ${amount} SOL` : '';
    const errorText = error ? `\nError: ${error}` : '';
    
    const message = `${emoji} <b>${action}</b>\n\nToken: <code>${tokenSymbol}</code>${amountText}${errorText}`;
    
    await this.sendMessage(message);
  }

  async sendPositionUpdate(tokenSymbol: string, action: 'BUY' | 'SELL', amount: number, profitLoss?: number): Promise<void> {
    const emoji = action === 'BUY' ? '🟢' : '🔴';
    const profitText = profitLoss ? `\nP&L: ${profitLoss > 0 ? '+' : ''}${profitLoss.toFixed(4)} SOL (${((profitLoss / amount) * 100).toFixed(2)}%)` : '';
    
    const message = `${emoji} <b>${action}</b>\n\nToken: <code>${tokenSymbol}</code>\nAmount: ${amount} SOL${profitText}`;
    
    await this.sendMessage(message);
  }
}

export const notificationService = new NotificationService();