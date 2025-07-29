import { Keypair, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
import { BotConfig } from '../types/index.js';
import bs58 from 'bs58';

dotenv.config()

export function loadConfig(): BotConfig {
  // Validate required environment variables
  const requiredVars = ['PRIVATE_KEY', 'SOLANA_RPC_URL'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Parse private key
  let walletKeypair: Keypair;
  try {
    const privateKeyBytes = bs58.decode(process.env.PRIVATE_KEY!);
    walletKeypair = Keypair.fromSecretKey(privateKeyBytes);
  } catch (error) {
    throw new Error('Invalid private key format. Please provide a base58 encoded private key.');
  }

  // Parse blacklisted/whitelisted creators
  const parseCreators = (envVar: string): PublicKey[] => {
    const creators = process.env[envVar];
    if (!creators) return [];
    
    return creators.split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => {
        try {
          return new PublicKey(s);
        } catch {
          console.warn(`Invalid public key in ${envVar}: ${s}`);
          return null;
        }
      })
      .filter((pk): pk is PublicKey => pk !== null);
  };

  return {
    // Solana RPC Configuration
    rpcUrl: process.env.SOLANA_RPC_URL!,
    wssUrl: process.env.SOLANA_WSS_URL || 'wss://api.mainnet-beta.solana.com',
    commitment: (process.env.COMMITMENT_LEVEL as any) || 'confirmed',

    // Wallet Configuration
    privateKey: process.env.PRIVATE_KEY!,
    walletKeypair,

    // Bot Configuration
    maxBuyAmountSol: parseFloat(process.env.MAX_BUY_AMOUNT_SOL || '0.1'),
    minLiquiditySol: parseFloat(process.env.MIN_LIQUIDITY_SOL || '5.0'),
    maxSlippagePercent: parseFloat(process.env.MAX_SLIPPAGE_PERCENT || '10'),
    priorityFeeLamports: parseInt(process.env.PRIORITY_FEE_LAMPORTS || '100000'),
    snipeDelayMs: parseInt(process.env.SNIPE_DELAY_MS || '1000'),

    // Security Filters
    maxBuyTaxPercent: parseFloat(process.env.MAX_BUY_TAX_PERCENT || '5'),
    maxSellTaxPercent: parseFloat(process.env.MAX_SELL_TAX_PERCENT || '10'),
    minHolderCount: parseInt(process.env.MIN_HOLDER_COUNT || '10'),
    maxTopHolderPercent: parseFloat(process.env.MAX_TOP_HOLDER_PERCENT || '30'),
    requireLiquidityLock: process.env.REQUIRE_LIQUIDITY_LOCK === 'true',
    liquidityLockMinDays: parseInt(process.env.LIQUIDITY_LOCK_MIN_DAYS || '30'),

    // Profit Taking
    takeProfitPercent: parseFloat(process.env.TAKE_PROFIT_PERCENT || '100'),
    stopLossPercent: parseFloat(process.env.STOP_LOSS_PERCENT || '50'),
    autoSellEnabled: process.env.AUTO_SELL_ENABLED === 'true',

    // Telegram
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    enableTelegram: process.env.ENABLE_TELEGRAM === 'true',

    // Web Interface
    webPort: parseInt(process.env.WEB_PORT || '3000'),
    enableWebUI: process.env.ENABLE_WEB_UI === 'true',

    // Logging
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    logToFile: process.env.LOG_TO_FILE === 'true',
    logToConsole: process.env.LOG_TO_CONSOLE === 'true',
    logDirectory: process.env.LOG_DIRECTORY || './logs',


    // Advanced Settings
    maxConcurrentSnipes: parseInt(process.env.MAX_CONCURRENT_SNIPES || '5'),
    rpcTimeoutMs: parseInt(process.env.RPC_TIMEOUT_MS || '30000'),
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
    blacklistedCreators: parseCreators('BLACKLISTED_CREATORS'),
    whitelistedCreators: parseCreators('WHITELISTED_CREATORS')
  };
}

export const config = loadConfig();