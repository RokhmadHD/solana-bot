export type SnipeResult = {
  tokenMint: string;
  success: boolean;
  timestamp: string;
};

export type Position = {
  tokenMint: string;
  profitLossPercent?: number;
};

export type MonitoringData = {
  totalSnipeAttempts: number;
  successfulSnipes: number;
  failedSnipes: number;
  totalProfitLoss: number;
  recentActivity: SnipeResult[];
  activePositions: Position[];
};

export interface TokenData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  status: 'Monitoring' | 'Sniping' | 'Success' | 'Failed';
}

export interface ActivityLogEntry {
  timestamp: string;
  message: string;
}

export interface ChartDataPoint {
  time: string;
  price: number;
}
