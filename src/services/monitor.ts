import { PublicKey, Connection } from '@solana/web3.js';
import { TokenInfo, MonitoringData, Position, SnipeResult } from '../types/index.js';
import { connectionManager } from './connection.js';
import { config } from '../config/config.js';
import { monitorLogger } from '../utils/logger.js';
import { tokenSniper } from './sniper.js';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class TokenMonitor extends EventEmitter {
  private connection: Connection;
  private wsConnection: Connection;
  private isMonitoring = false;
  private positions: Map<string, Position> = new Map();
  private recentActivity: SnipeResult[] = [];
  private startTime = Date.now();
  private recentlySniped: Set<string> = new Set();
  private monitoringStats = {
    totalSnipeAttempts: 0,
    successfulSnipes: 0,
    failedSnipes: 0,
    totalProfitLoss: 0
  };
  private markMintAsSniped(mint: string, ttlMs: number = 45000): void {
    this.recentlySniped.add(mint);
    setTimeout(() => this.recentlySniped.delete(mint), ttlMs);
  }


  constructor() {
    super();
    this.connection = connectionManager.getConnection();
    this.wsConnection = connectionManager.getWsConnection();
  }

  /**
   * Starts monitoring for new token launches
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      monitorLogger.warn('Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    monitorLogger.info('Starting token monitoring');

    try {
      // Monitor token mint program for new token creations
      await this.monitorTokenMints();

      // Monitor DEX programs for new liquidity additions
      await this.monitorLiquidityPools();

      // Start position monitoring for profit/loss tracking
      this.startPositionMonitoring();

      monitorLogger.info('Token monitoring started successfully');

    } catch (error) {
      monitorLogger.error('Failed to start monitoring', { error });
      this.isMonitoring = false;
      throw error;
    }
  }

  /**
   * Stops all monitoring activities
   */
  async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;
    monitorLogger.info('Token monitoring stopped');
  }

  private async monitorTokenMints(): Promise<void> {
    try {
      // Subscribe to Token Program account changes
      const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

      this.wsConnection.onAccountChange(
        TOKEN_PROGRAM_ID,
        (accountInfo, context) => {
          // This would trigger on token mint creations
          this.handleNewTokenMint(accountInfo, context);
        },
        'confirmed'
      );

      monitorLogger.info('Token mint monitoring established');

    } catch (error) {
      monitorLogger.error('Failed to establish token mint monitoring', { error });
      throw error;
    }
  }

  private async monitorLiquidityPools(): Promise<void> {
    try {
      // Monitor Raydium AMM Program
      const RAYDIUM_AMM_PROGRAM = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');

      this.wsConnection.onProgramAccountChange(
        RAYDIUM_AMM_PROGRAM,
        (keyedAccountInfo) => {
          this.handleNewLiquidityPool(keyedAccountInfo);
        },
        'confirmed',
        [
          { dataSize: 752 } // Raydium AMM pool size filter
        ]
      );

      // Monitor Orca Program
      const ORCA_PROGRAM = new PublicKey('9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP');

      this.wsConnection.onProgramAccountChange(
        ORCA_PROGRAM,
        (keyedAccountInfo) => {
          this.handleNewLiquidityPool(keyedAccountInfo);
        },
        'confirmed'
      );

      monitorLogger.info('Liquidity pool monitoring established');

    } catch (error) {
      monitorLogger.error('Failed to establish liquidity pool monitoring', { error });
      throw error;
    }
  }

  private async handleNewTokenMint(accountInfo: any, context: any): Promise<void> {
    try {
      // Parse token mint data
      const tokenInfo = await this.parseTokenMintData(accountInfo, context);

      if (tokenInfo) {
        monitorLogger.info('New token detected', {
          mint: tokenInfo.mint.toString(),
          symbol: tokenInfo.symbol,
          creator: tokenInfo.creator.toString()
        });

        // Emit event for UI updates
        this.emit('newToken', tokenInfo);

        // Trigger snipe attempt
        await this.attemptSnipe(tokenInfo);
      }

    } catch (error) {
      monitorLogger.error('Error handling new token mint', { error });
    }
  }

  private async handleNewLiquidityPool(keyedAccountInfo: any): Promise<void> {
    try {
      // Parse liquidity pool data to extract token information
      const tokenInfo = await this.parseLiquidityPoolData(keyedAccountInfo);

      if (tokenInfo) {
        monitorLogger.info('New liquidity pool detected', {
          mint: tokenInfo.mint.toString(),
          liquidity: tokenInfo.liquidityAmount
        });

        // Only snipe if liquidity meets minimum requirements
        if (tokenInfo.liquidityAmount && tokenInfo.liquidityAmount >= config.minLiquiditySol) {
          await this.attemptSnipe(tokenInfo);
        }
      }

    } catch (error) {
      monitorLogger.error('Error handling new liquidity pool', { error });
    }
  }

  private async parseTokenMintData(accountInfo: any, context: any): Promise<TokenInfo | null> {
    try {
      // This would parse the token mint account data
      // For now, returning a mock TokenInfo
      return {
        mint: new PublicKey('11111111111111111111111111111112'), // Placeholder
        decimals: 9,
        supply: 1000000,
        creator: new PublicKey('11111111111111111111111111111112'),
        createdAt: new Date()
      };
    } catch (error) {
      monitorLogger.error('Failed to parse token mint data', { error });
      return null;
    }
  }

  private async parseLiquidityPoolData(keyedAccountInfo: any): Promise<TokenInfo | null> {
    try {
      // This would parse the liquidity pool data from Raydium/Orca
      // Extract token mint, liquidity amount, etc.
      return {
        mint: new PublicKey('11111111111111111111111111111112'), // Placeholder
        decimals: 9,
        supply: 1000000,
        creator: new PublicKey('11111111111111111111111111111112'),
        createdAt: new Date(),
        liquidityAmount: 10.5 // SOL
      };
    } catch (error) {
      monitorLogger.error('Failed to parse liquidity pool data', { error });
      return null;
    }
  }

  private async attemptSnipe(tokenInfo: TokenInfo): Promise<void> {
    const mintStr = tokenInfo.mint.toString();

    if (this.recentlySniped.has(mintStr)) {
      monitorLogger.warn('⏳ Token already recently sniped, skipping...', { mint: mintStr });
      return;
    }

    this.markMintAsSniped(mintStr); // prevent future snipes for short time
    this.monitoringStats.totalSnipeAttempts++;
    try {
      const result = await tokenSniper.snipeToken(tokenInfo);

      // Update stats
      if (result.success) {
        this.monitoringStats.successfulSnipes++;
        this.addPosition(tokenInfo, result);
      } else {
        this.monitoringStats.failedSnipes++;
      }

      // Add to recent activity
      this.recentActivity.unshift(result);
      if (this.recentActivity.length > 50) {
        this.recentActivity = this.recentActivity.slice(0, 50);
      }

      // Emit monitoring update
      this.emit('monitoringUpdate', this.getMonitoringData());

    } catch (error) {
      monitorLogger.error('Snipe attempt failed', {
        mint: tokenInfo.mint.toString(),
        error
      });
    }
  }

  private addPosition(tokenInfo: TokenInfo, snipeResult: SnipeResult): void {
    const position: Position = {
      tokenMint: tokenInfo.mint,
      amountTokens: snipeResult.amountTokens || 0,
      costBasisSol: snipeResult.amountSol,
      entryTimestamp: snipeResult.timestamp,
      isActive: true
    };

    this.positions.set(tokenInfo.mint.toString(), position);

    monitorLogger.info('Position added', {
      mint: tokenInfo.mint.toString(),
      amount: position.amountTokens,
      cost: position.costBasisSol
    });
  }

  private startPositionMonitoring(): void {
    if (!config.autoSellEnabled) return;

    // Monitor positions every 30 seconds for profit/loss
    setInterval(async () => {
      for (const [mintStr, position] of this.positions) {
        if (!position.isActive) continue;

        try {
          await this.updatePositionValue(position);
          await this.checkExitConditions(position);
        } catch (error) {
          monitorLogger.error('Error updating position', {
            mint: mintStr,
            error
          });
        }
      }
    }, 30000);
  }

  private async updatePositionValue(position: Position): Promise<void> {
    // This would get current token price and calculate P&L
    // For now, using placeholder values
    position.currentValueSol = position.costBasisSol * 1.1; // +10% placeholder
    position.profitLoss = position.currentValueSol - position.costBasisSol;
    position.profitLossPercent = (position.profitLoss / position.costBasisSol) * 100;
  }

  private async checkExitConditions(position: Position): Promise<void> {
    if (!position.profitLossPercent) return;

    const shouldTakeProfit = position.profitLossPercent >= config.takeProfitPercent;
    const shouldStopLoss = position.profitLossPercent <= -config.stopLossPercent;

    if (shouldTakeProfit || shouldStopLoss) {
      const action = shouldTakeProfit ? 'TAKE_PROFIT' : 'STOP_LOSS';

      monitorLogger.info(`Executing ${action}`, {
        mint: position.tokenMint.toString(),
        profitLoss: position.profitLossPercent
      });

      // Execute sell transaction (placeholder)
      await this.executeSell(position);
    }
  }

  private async executeSell(position: Position): Promise<void> {
    // Placeholder for sell execution
    position.isActive = false;
    position.exitTimestamp = new Date();

    if (position.profitLoss) {
      this.monitoringStats.totalProfitLoss += position.profitLoss;
    }

    monitorLogger.info('Position closed', {
      mint: position.tokenMint.toString(),
      profitLoss: position.profitLoss
    });
  }

  public getMonitoringData(): MonitoringData {
    return {
      ...this.monitoringStats,
      activePositions: Array.from(this.positions.values()).filter(p => p.isActive),
      recentActivity: this.recentActivity,
      uptime: Date.now() - this.startTime,
      lastHeartbeat: new Date()
    };
  }

  public isActive(): boolean {
    return this.isMonitoring;
  }
}

export const tokenMonitor = new TokenMonitor();