import { PublicKey, Keypair } from '@solana/web3.js';

export interface BotConfig {
  // Solana RPC Configuration
  rpcUrl: string;
  wssUrl: string;
  commitment: 'processed' | 'confirmed' | 'finalized';

  // Wallet Configuration
  privateKey: string;
  walletKeypair: Keypair;

  // Bot Configuration
  maxBuyAmountSol: number;
  minLiquiditySol: number;
  maxSlippagePercent: number;
  priorityFeeLamports: number;
  snipeDelayMs: number;

  // Security Filters
  maxBuyTaxPercent: number;
  maxSellTaxPercent: number;
  minHolderCount: number;
  maxTopHolderPercent: number;
  requireLiquidityLock: boolean;
  liquidityLockMinDays: number;

  // Profit Taking
  takeProfitPercent: number;
  stopLossPercent: number;
  autoSellEnabled: boolean;

  // Telegram
  telegramBotToken?: string;
  telegramChatId?: string;
  enableTelegram: boolean;

  // Web Interface
  webPort: number;
  enableWebUI: boolean;

  // Logging
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  logToFile: boolean;
  logToConsole: boolean
  logDirectory: string;

  // Advanced Settings
  maxConcurrentSnipes: number;
  rpcTimeoutMs: number;
  retryAttempts: number;
  blacklistedCreators: PublicKey[];
  whitelistedCreators: PublicKey[];
}

export interface TokenInfo {
  mint: PublicKey;
  name?: string;
  symbol?: string;
  decimals: number;
  supply: number;
  creator: PublicKey;
  createdAt: Date;
  liquidityPoolAddress?: PublicKey;
  liquidityAmount?: number;
}

export interface SecurityAnalysis {
  isSecure: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  issues: SecurityIssue[];
  score: number; // 0-100, higher is better
}

export interface SecurityIssue {
  type: SecurityIssueType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  recommendation?: string;
}

export enum SecurityIssueType {
  HIGH_BUY_TAX = 'HIGH_BUY_TAX',
  HIGH_SELL_TAX = 'HIGH_SELL_TAX',
  NO_LIQUIDITY_LOCK = 'NO_LIQUIDITY_LOCK',
  WHALE_CONCENTRATION = 'WHALE_CONCENTRATION',
  BLACKLIST_FUNCTION = 'BLACKLIST_FUNCTION',
  PAUSE_FUNCTION = 'PAUSE_FUNCTION',
  MINT_FUNCTION = 'MINT_FUNCTION',
  LOW_HOLDER_COUNT = 'LOW_HOLDER_COUNT',
  SUSPICIOUS_CREATOR = 'SUSPICIOUS_CREATOR',
  ANTI_BOT_MECHANISM = 'ANTI_BOT_MECHANISM'
}

export interface SnipeResult {
  success: boolean;
  tokenMint: PublicKey;
  transactionSignature?: string;
  amountSol: number;
  amountTokens?: number;
  error?: string;
  gasUsed?: number;
  timestamp: Date;
}

export interface Position {
  tokenMint: PublicKey;
  amountTokens: number;
  costBasisSol: number;
  currentValueSol?: number;
  profitLoss?: number;
  profitLossPercent?: number;
  entryTimestamp: Date;
  exitTimestamp?: Date;
  isActive: boolean;
}

export interface MonitoringData {
  totalSnipeAttempts: number;
  successfulSnipes: number;
  failedSnipes: number;
  totalProfitLoss: number;
  activePositions: Position[];
  recentActivity: SnipeResult[];
  uptime: number;
  lastHeartbeat: Date;
}