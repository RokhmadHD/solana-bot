import { PublicKey, Connection } from '@solana/web3.js';
import { TokenInfo, SecurityAnalysis, SecurityIssue, SecurityIssueType } from '../types/index.js';
import { config } from '../config/config.js';
import { connectionManager } from './connection.js';
import { securityLogger } from '../utils/logger.js';
import axios from 'axios';

export class SecurityAnalyzer {
  private connection: Connection;

  constructor() {
    this.connection = connectionManager.getConnection();
  }

  /**
   * Performs comprehensive security analysis on a token
   */
  async analyzeToken(tokenInfo: TokenInfo): Promise<SecurityAnalysis> {
    securityLogger.info('Starting security analysis', { 
      mint: tokenInfo.mint.toString(),
      symbol: tokenInfo.symbol 
    });

    const issues: SecurityIssue[] = [];
    let score = 100; // Start with perfect score and deduct points

    try {
      // Check creator blacklist/whitelist
      await this.checkCreatorReputation(tokenInfo, issues);

      // Analyze token metadata and contract
      await this.analyzeTokenContract(tokenInfo, issues);

      // Check liquidity and holder distribution
      await this.analyzeLiquidityAndHolders(tokenInfo, issues);

      // Check for common scam patterns
      await this.checkScamPatterns(tokenInfo, issues);

      // Calculate risk score
      score = this.calculateSecurityScore(issues);

      const riskLevel = this.determineRiskLevel(score, issues);

      const analysis: SecurityAnalysis = {
        isSecure: score >= 70 && !issues.some(i => i.severity === 'CRITICAL'),
        riskLevel,
        issues,
        score
      };

      securityLogger.info('Security analysis completed', {
        mint: tokenInfo.mint.toString(),
        score,
        riskLevel,
        issueCount: issues.length,
        isSecure: analysis.isSecure
      });

      return analysis;

    } catch (error) {
      securityLogger.error('Security analysis failed', { 
        mint: tokenInfo.mint.toString(),
        error 
      });

      return {
        isSecure: false,
        riskLevel: 'CRITICAL',
        issues: [{
          type: SecurityIssueType.SUSPICIOUS_CREATOR,
          severity: 'CRITICAL',
          description: 'Failed to complete security analysis',
          recommendation: 'Skip this token due to analysis failure'
        }],
        score: 0
      };
    }
  }

  private async checkCreatorReputation(tokenInfo: TokenInfo, issues: SecurityIssue[]): Promise<void> {
    // Check blacklist
    if (config.blacklistedCreators.some(creator => creator.equals(tokenInfo.creator))) {
      issues.push({
        type: SecurityIssueType.SUSPICIOUS_CREATOR,
        severity: 'CRITICAL',
        description: 'Token creator is on blacklist',
        recommendation: 'Skip this token - creator has been flagged'
      });
      return;
    }

    // Check whitelist (if configured, only allow whitelisted creators)
    if (config.whitelistedCreators.length > 0) {
      if (!config.whitelistedCreators.some(creator => creator.equals(tokenInfo.creator))) {
        issues.push({
          type: SecurityIssueType.SUSPICIOUS_CREATOR,
          severity: 'HIGH',
          description: 'Token creator is not on whitelist',
          recommendation: 'Consider skipping - creator not pre-approved'
        });
      }
    }
  }

  private async analyzeTokenContract(tokenInfo: TokenInfo, issues: SecurityIssue[]): Promise<void> {
    try {
      // Get token mint info
      const mintInfo = await this.connection.getParsedAccountInfo(tokenInfo.mint);
      
      if (!mintInfo.value) {
        issues.push({
          type: SecurityIssueType.SUSPICIOUS_CREATOR,
          severity: 'CRITICAL',
          description: 'Unable to fetch token mint information',
          recommendation: 'Skip this token - invalid mint'
        });
        return;
      }

      // Check if mint authority is present (can create more tokens)
      const parsedInfo = mintInfo.value.data as any;
      if (parsedInfo.parsed?.info?.mintAuthority) {
        issues.push({
          type: SecurityIssueType.MINT_FUNCTION,
          severity: 'HIGH',
          description: 'Token has mint authority - supply can be increased',
          recommendation: 'High risk - creator can mint more tokens'
        });
      }

      // Check freeze authority
      if (parsedInfo.parsed?.info?.freezeAuthority) {
        issues.push({
          type: SecurityIssueType.BLACKLIST_FUNCTION,
          severity: 'HIGH',
          description: 'Token has freeze authority - accounts can be frozen',
          recommendation: 'High risk - creator can freeze token transfers'
        });
      }

    } catch (error) {
      securityLogger.error('Failed to analyze token contract', { 
        mint: tokenInfo.mint.toString(),
        error 
      });
      
      issues.push({
        type: SecurityIssueType.SUSPICIOUS_CREATOR,
        severity: 'MEDIUM',
        description: 'Unable to fully analyze token contract',
        recommendation: 'Proceed with caution - contract analysis incomplete'
      });
    }
  }

  private async analyzeLiquidityAndHolders(tokenInfo: TokenInfo, issues: SecurityIssue[]): Promise<void> {
    try {
      // Check minimum liquidity requirement
      if (tokenInfo.liquidityAmount && tokenInfo.liquidityAmount < config.minLiquiditySol) {
        issues.push({
          type: SecurityIssueType.NO_LIQUIDITY_LOCK,
          severity: 'HIGH',
          description: `Low liquidity: ${tokenInfo.liquidityAmount} SOL (min: ${config.minLiquiditySol} SOL)`,
          recommendation: 'Risk of price manipulation due to low liquidity'
        });
      }

      // Analyze holder distribution
      await this.analyzeHolderDistribution(tokenInfo, issues);

      // Check liquidity lock (this would require integration with known liquidity lockers)
      if (config.requireLiquidityLock) {
        await this.checkLiquidityLock(tokenInfo, issues);
      }

    } catch (error) {
      securityLogger.error('Failed to analyze liquidity and holders', { 
        mint: tokenInfo.mint.toString(),
        error 
      });
    }
  }

  private async analyzeHolderDistribution(tokenInfo: TokenInfo, issues: SecurityIssue[]): Promise<void> {
    try {
      // Get token accounts (top holders)
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token program
        {
          filters: [
            { dataSize: 165 },
            { memcmp: { offset: 0, bytes: tokenInfo.mint.toString() } }
          ]
        }
      );

      if (tokenAccounts.length < config.minHolderCount) {
        issues.push({
          type: SecurityIssueType.LOW_HOLDER_COUNT,
          severity: 'MEDIUM',
          description: `Low holder count: ${tokenAccounts.length} (min: ${config.minHolderCount})`,
          recommendation: 'Token may lack sufficient distribution'
        });
      }

      // Analyze top holder concentration
      const holders = tokenAccounts
        .map(account => {
          const data = account.account.data;
          // Parse token account data to get balance
          return {
            owner: account.pubkey,
            balance: 0 // Would need proper parsing here
          };
        })
        .sort((a, b) => b.balance - a.balance);

      // Check if top holder has too much
      if (holders.length > 0 && tokenInfo.supply > 0) {
        const topHolderPercent = (holders[0].balance / tokenInfo.supply) * 100;
        if (topHolderPercent > config.maxTopHolderPercent) {
          issues.push({
            type: SecurityIssueType.WHALE_CONCENTRATION,
            severity: 'HIGH',
            description: `Top holder owns ${topHolderPercent.toFixed(2)}% of supply`,
            recommendation: 'Risk of price manipulation by large holder'
          });
        }
      }

    } catch (error) {
      securityLogger.error('Failed to analyze holder distribution', { error });
    }
  }

  private async checkLiquidityLock(tokenInfo: TokenInfo, issues: SecurityIssue[]): Promise<void> {
    // This would integrate with known liquidity lockers on Solana
    // For now, we'll add a placeholder check
    
    issues.push({
      type: SecurityIssueType.NO_LIQUIDITY_LOCK,
      severity: 'MEDIUM',
      description: 'Unable to verify liquidity lock status',
      recommendation: 'Manually verify liquidity is locked before trading'
    });
  }

  private async checkScamPatterns(tokenInfo: TokenInfo, issues: SecurityIssue[]): Promise<void> {
    // Check for suspicious name patterns
    if (tokenInfo.name || tokenInfo.symbol) {
      const suspiciousPatterns = [
        /moon/i, /rocket/i, /safe/i, /doge/i, /shib/i, /elon/i,
        /test/i, /temp/i, /fake/i, /scam/i
      ];

      const tokenName = (tokenInfo.name || tokenInfo.symbol || '').toLowerCase();
      const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(tokenName));

      if (hasSuspiciousPattern) {
        issues.push({
          type: SecurityIssueType.SUSPICIOUS_CREATOR,
          severity: 'MEDIUM',
          description: 'Token name contains suspicious patterns',
          recommendation: 'Exercise caution - name suggests potential scam'
        });
      }
    }

    // Check token age (very new tokens are riskier)
    const tokenAge = Date.now() - tokenInfo.createdAt.getTime();
    if (tokenAge < 300000) { // Less than 5 minutes old
      issues.push({
        type: SecurityIssueType.ANTI_BOT_MECHANISM,
        severity: 'LOW',
        description: 'Very new token (less than 5 minutes old)',
        recommendation: 'Consider waiting for more market validation'
      });
    }
  }

  private calculateSecurityScore(issues: SecurityIssue[]): number {
    let score = 100;

    for (const issue of issues) {
      switch (issue.severity) {
        case 'CRITICAL':
          score -= 50;
          break;
        case 'HIGH':
          score -= 25;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    }

    return Math.max(0, score);
  }

  private determineRiskLevel(score: number, issues: SecurityIssue[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (issues.some(i => i.severity === 'CRITICAL') || score < 30) {
      return 'CRITICAL';
    } else if (score < 50) {
      return 'HIGH';
    } else if (score < 70) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }
}

export const securityAnalyzer = new SecurityAnalyzer();