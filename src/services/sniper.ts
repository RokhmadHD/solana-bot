import { 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  ComputeBudgetProgram
} from '@solana/web3.js';
import { 
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { TokenInfo, SnipeResult } from '../types/index.js';
import { config } from '../config/config.js';
import { connectionManager } from './connection.js';
import { snipeLogger } from '../utils/logger.js';
import { securityAnalyzer } from './security.js';
import { notificationService } from './notifications.js';

export class TokenSniper {
  private activeSnipes = new Map<string, Promise<SnipeResult>>();
  private snipeQueue: TokenInfo[] = [];
  private isProcessing = false;

  /**
   * Attempts to snipe a token after security validation
   */
  async snipeToken(tokenInfo: TokenInfo): Promise<SnipeResult> {
    const tokenMint = tokenInfo.mint.toString();
    
    snipeLogger.info('Attempting to snipe token', {
      mint: tokenMint,
      symbol: tokenInfo.symbol,
      maxBuyAmount: config.maxBuyAmountSol
    });

    // Check if already sniping this token
    if (this.activeSnipes.has(tokenMint)) {
      snipeLogger.warn('Token snipe already in progress', { mint: tokenMint });
      return this.activeSnipes.get(tokenMint)!;
    }

    // Check concurrent snipe limit
    if (this.activeSnipes.size >= config.maxConcurrentSnipes) {
      snipeLogger.warn('Max concurrent snipes reached, queueing token', { 
        mint: tokenMint,
        activeSnipes: this.activeSnipes.size 
      });
      
      this.snipeQueue.push(tokenInfo);
      return {
        success: false,
        tokenMint: tokenInfo.mint,
        amountSol: 0,
        error: 'Max concurrent snipes reached - token queued',
        timestamp: new Date()
      };
    }

    // Create snipe promise
    const snipePromise = this.executeSnipe(tokenInfo);
    this.activeSnipes.set(tokenMint, snipePromise);

    try {
      const result = await snipePromise;
      return result;
    } finally {
      this.activeSnipes.delete(tokenMint);
      this.processQueue();
    }
  }

  private async executeSnipe(tokenInfo: TokenInfo): Promise<SnipeResult> {
    const startTime = Date.now();
    
    try {
      // Wait for configured snipe delay
      if (config.snipeDelayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, config.snipeDelayMs));
      }

      // Perform security analysis
      const securityAnalysis = await securityAnalyzer.analyzeToken(tokenInfo);
      
      if (!securityAnalysis.isSecure) {
        snipeLogger.warn('Token failed security analysis', {
          mint: tokenInfo.mint.toString(),
          riskLevel: securityAnalysis.riskLevel,
          issues: securityAnalysis.issues.length
        });

        return {
          success: false,
          tokenMint: tokenInfo.mint,
          amountSol: 0,
          error: `Security check failed: ${securityAnalysis.riskLevel} risk`,
          timestamp: new Date()
        };
      }

      // Check wallet balance
      const balance = await connectionManager.getBalance();
      if (balance < config.maxBuyAmountSol) {
        snipeLogger.error('Insufficient balance for snipe', {
          balance,
          required: config.maxBuyAmountSol
        });

        return {
          success: false,
          tokenMint: tokenInfo.mint,
          amountSol: 0,
          error: 'Insufficient SOL balance',
          timestamp: new Date()
        };
      }

      // Execute the buy transaction
      const result = await this.executeBuyTransaction(tokenInfo);
      
      // Log result
      const executionTime = Date.now() - startTime;
      snipeLogger.info('Snipe attempt completed', {
        mint: tokenInfo.mint.toString(),
        success: result.success,
        executionTime,
        error: result.error
      });

      // Send notification
      if (config.enableTelegram) {
        const message = result.success 
          ? `✅ Successfully sniped ${tokenInfo.symbol || tokenInfo.mint.toString().slice(0, 8)} for ${result.amountSol} SOL`
          : `❌ Failed to snipe ${tokenInfo.symbol || tokenInfo.mint.toString().slice(0, 8)}: ${result.error}`;
        
        await notificationService.sendMessage(message);
      }

      return result;

    } catch (error) {
      snipeLogger.error('Snipe execution failed', {
        mint: tokenInfo.mint.toString(),
        error
      });

      return {
        success: false,
        tokenMint: tokenInfo.mint,
        amountSol: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  private async executeBuyTransaction(tokenInfo: TokenInfo): Promise<SnipeResult> {
    const connection = connectionManager.getConnection();
    const wallet = config.walletKeypair;

    try {
      // Get or create associated token account
      const associatedTokenAddress = await getAssociatedTokenAddress(
        tokenInfo.mint,
        wallet.publicKey
      );

      const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
      const transaction = new Transaction();

      // Add priority fee
      if (config.priorityFeeLamports > 0) {
        transaction.add(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: config.priorityFeeLamports
          })
        );
      }

      // Create token account if it doesn't exist
      if (!accountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            associatedTokenAddress,
            wallet.publicKey,
            tokenInfo.mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      // Add swap instruction (this would integrate with Jupiter, Raydium, or other DEX)
      // For now, we'll create a placeholder instruction
      const swapInstruction = await this.createSwapInstruction(tokenInfo);
      transaction.add(swapInstruction);

      // Sign and send transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [wallet],
        {
          commitment: config.commitment as any,
          maxRetries: config.retryAttempts
        }
      );

      snipeLogger.info('Buy transaction confirmed', {
        mint: tokenInfo.mint.toString(),
        signature,
        amount: config.maxBuyAmountSol
      });

      return {
        success: true,
        tokenMint: tokenInfo.mint,
        transactionSignature: signature,
        amountSol: config.maxBuyAmountSol,
        timestamp: new Date()
      };

    } catch (error) {
      snipeLogger.error('Buy transaction failed', {
        mint: tokenInfo.mint.toString(),
        error
      });

      return {
        success: false,
        tokenMint: tokenInfo.mint,
        amountSol: 0,
        error: error instanceof Error ? error.message : 'Transaction failed',
        timestamp: new Date()
      };
    }
  }

  private async createSwapInstruction(tokenInfo: TokenInfo): Promise<TransactionInstruction> {
    // This is a placeholder - in production, you would integrate with:
    // - Jupiter Aggregator for best prices
    // - Raydium for direct DEX trading
    // - Orca for another DEX option
    
    // For demonstration, creating a simple system transfer
    return SystemProgram.transfer({
      fromPubkey: config.walletKeypair.publicKey,
      toPubkey: config.walletKeypair.publicKey, // Placeholder
      lamports: Math.floor(config.maxBuyAmountSol * LAMPORTS_PER_SOL)
    });
  }

  private processQueue(): void {
    if (this.isProcessing || this.snipeQueue.length === 0) {
      return;
    }

    if (this.activeSnipes.size < config.maxConcurrentSnipes) {
      this.isProcessing = true;
      const tokenInfo = this.snipeQueue.shift();
      
      if (tokenInfo) {
        snipeLogger.info('Processing queued token', {
          mint: tokenInfo.mint.toString(),
          queueLength: this.snipeQueue.length
        });
        
        this.snipeToken(tokenInfo).finally(() => {
          this.isProcessing = false;
          // Process next item in queue
          setTimeout(() => this.processQueue(), 100);
        });
      } else {
        this.isProcessing = false;
      }
    }
  }

  public getActiveSnipeCount(): number {
    return this.activeSnipes.size;
  }

  public getQueueLength(): number {
    return this.snipeQueue.length;
  }

  public clearQueue(): void {
    this.snipeQueue = [];
    snipeLogger.info('Snipe queue cleared');
  }
}

export const tokenSniper = new TokenSniper();