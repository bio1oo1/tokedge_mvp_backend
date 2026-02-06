import { Injectable } from '@nestjs/common';
import { WalletData } from './nansen.service';

interface WalletMetrics {
  holdingConviction: number; // 0-30
  tradingDiscipline: number; // 0-25
  realizedEdge: number; // 0-30
  behaviorQuality: number; // 0-15
}

export interface ScoringResult {
  score: number;
  metrics: WalletMetrics;
  meetsMinimumThresholds: boolean;
  insufficientData?: boolean;
  highConviction?: boolean;
  positiveEdge?: boolean;
  panicSelling?: boolean;
  strongEdge?: boolean;
  higherChurn?: boolean;
  extremeChurn?: boolean;
  poorEdge?: boolean;
}

@Injectable()
export class WalletScoringService {
  async scoreWallet(
    walletAddress: string,
    walletData: WalletData,
  ): Promise<ScoringResult> {
    // Check data sufficiency thresholds
    const meetsMinimumThresholds = this.checkDataSufficiency(walletData);
    
    if (!meetsMinimumThresholds) {
      return {
        score: 0,
        metrics: {
          holdingConviction: 0,
          tradingDiscipline: 0,
          realizedEdge: 0,
          behaviorQuality: 0,
        },
        meetsMinimumThresholds: false,
        insufficientData: true,
      };
    }

    // Calculate metrics
    const holdingConviction = this.calculateHoldingConviction(walletData);
    const tradingDiscipline = this.calculateTradingDiscipline(walletData);
    const realizedEdge = this.calculateRealizedEdge(walletData);
    const behaviorQuality = this.calculateBehaviorQuality(walletData);

    const totalScore = holdingConviction + tradingDiscipline + realizedEdge + behaviorQuality;

    return {
      score: Math.round(totalScore),
      metrics: {
        holdingConviction,
        tradingDiscipline,
        realizedEdge,
        behaviorQuality,
      },
      meetsMinimumThresholds: true,
      highConviction: holdingConviction >= 25,
      positiveEdge: realizedEdge >= 25,
      panicSelling: holdingConviction < 15,
      strongEdge: realizedEdge >= 20,
      higherChurn: tradingDiscipline < 15,
      extremeChurn: tradingDiscipline < 10,
      poorEdge: realizedEdge < 10,
    };
  }

  private checkDataSufficiency(walletData: WalletData): boolean {
    // Minimum thresholds:
    // - 8 swaps or 5 closed positions in last 180 days
    // - Wallet age >= 60 days
    // - At least 3 distinct assets traded

    const swaps = walletData.swaps?.length || 0;
    const closedPositions = walletData.closedPositions?.length || 0;
    const walletAge = walletData.walletAge || 0;
    const distinctAssets = walletData.distinctAssets || 0;

    return (
      (swaps >= 8 || closedPositions >= 5) &&
      walletAge >= 60 &&
      distinctAssets >= 3
    );
  }

  private calculateHoldingConviction(walletData: WalletData): number {
    // 1. Holding Conviction (30 points)
    // - Median holding period of profitable positions
    // - % held beyond 14 and 30 days
    // - Panic selling penalty

    const closedPositions = walletData.closedPositions || [];
    if (closedPositions.length === 0) {
      return 0;
    }

    // Calculate holding periods for profitable positions
    const profitablePositions = closedPositions.filter(p => p.pnl_usd_realised > 0);
    if (profitablePositions.length === 0) {
      return 0;
    }

    // Estimate holding periods from buy/sell transactions
    // For simplicity, we'll use the PnL data which includes buy/sell info
    // In a real implementation, we'd track actual holding periods from transactions
    const holdingPeriods: number[] = [];
    
    // Use transaction timestamps to estimate holding periods
    const tokenHoldingPeriods = new Map<string, number[]>();
    
    walletData.transactions.forEach(tx => {
      const txDate = new Date(tx.block_timestamp).getTime();
      
      // Track when tokens were received (bought)
      tx.tokens_received.forEach(token => {
        const key = token.token_address.toLowerCase();
        if (!tokenHoldingPeriods.has(key)) {
          tokenHoldingPeriods.set(key, []);
        }
        tokenHoldingPeriods.get(key)!.push(txDate);
      });

      // When tokens are sent (sold), calculate holding period
      tx.tokens_sent.forEach(token => {
        const key = token.token_address.toLowerCase();
        const buyDates = tokenHoldingPeriods.get(key);
        if (buyDates && buyDates.length > 0) {
          const buyDate = buyDates.shift()!;
          const holdingDays = (txDate - buyDate) / (1000 * 60 * 60 * 24);
          if (holdingDays > 0) {
            holdingPeriods.push(holdingDays);
          }
        }
      });
    });

    if (holdingPeriods.length === 0) {
      // Fallback: use PnL data to estimate
      const avgHoldingDays = profitablePositions.length > 0 ? 30 : 0;
      holdingPeriods.push(avgHoldingDays);
    }

    // Calculate median holding period
    holdingPeriods.sort((a, b) => a - b);
    const medianHoldingPeriod = holdingPeriods[Math.floor(holdingPeriods.length / 2)];

    // Score based on median holding period (max 15 points)
    let score = 0;
    if (medianHoldingPeriod >= 30) {
      score += 15;
    } else if (medianHoldingPeriod >= 14) {
      score += 10;
    } else if (medianHoldingPeriod >= 7) {
      score += 5;
    }

    // % held beyond 14 and 30 days (max 10 points)
    const held14Plus = holdingPeriods.filter(p => p >= 14).length;
    const held30Plus = holdingPeriods.filter(p => p >= 30).length;
    const pct14Plus = holdingPeriods.length > 0 ? held14Plus / holdingPeriods.length : 0;
    const pct30Plus = holdingPeriods.length > 0 ? held30Plus / holdingPeriods.length : 0;

    score += Math.min(5, pct14Plus * 5); // Up to 5 points for 14+ days
    score += Math.min(5, pct30Plus * 5); // Up to 5 points for 30+ days

    // Panic selling penalty (deduct up to 5 points)
    const panicSells = holdingPeriods.filter(p => p < 1).length;
    const panicPct = holdingPeriods.length > 0 ? panicSells / holdingPeriods.length : 0;
    if (panicPct > 0.3) {
      score -= Math.min(5, panicPct * 10); // Penalty for >30% panic sells
    }

    return Math.max(0, Math.min(30, score));
  }

  private calculateTradingDiscipline(walletData: WalletData): number {
    // 2. Trading Discipline (25 points)
    // - Trade frequency consistency
    // - Churn per asset
    // - Overtrading penalty

    const transactions = walletData.transactions || [];
    const swaps = walletData.swaps || [];
    
    if (transactions.length === 0) {
      return 0;
    }

    let score = 0;

    // Trade frequency consistency (max 10 points)
    // Calculate variance in days between trades
    const tradeDates = transactions
      .map(t => new Date(t.block_timestamp).getTime())
      .sort((a, b) => a - b);
    
    if (tradeDates.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tradeDates.length; i++) {
        const days = (tradeDates[i] - tradeDates[i - 1]) / (1000 * 60 * 60 * 24);
        intervals.push(days);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = avgInterval > 0 ? stdDev / avgInterval : 1;

      // Lower variance = more consistent = higher score
      if (coefficientOfVariation < 0.5) {
        score += 10;
      } else if (coefficientOfVariation < 1.0) {
        score += 7;
      } else if (coefficientOfVariation < 1.5) {
        score += 4;
      }
    }

    // Churn per asset (max 10 points)
    // Lower churn = higher score
    const pnlDetails = walletData.pnlDetails || [];
    const totalTrades = pnlDetails.reduce((sum, p) => {
      const buys = parseInt(p.nof_buys) || 0;
      const sells = parseInt(p.nof_sells) || 0;
      return sum + buys + sells;
    }, 0);
    
    const uniqueAssets = new Set(pnlDetails.map(p => p.token_address.toLowerCase())).size;
    const avgTradesPerAsset = uniqueAssets > 0 ? totalTrades / uniqueAssets : 0;

    if (avgTradesPerAsset <= 2) {
      score += 10; // Low churn
    } else if (avgTradesPerAsset <= 4) {
      score += 7;
    } else if (avgTradesPerAsset <= 6) {
      score += 4;
    }

    // Overtrading penalty (max 5 points deduction)
    const daysActive = walletData.walletAge || 1;
    const tradesPerDay = transactions.length / daysActive;
    
    if (tradesPerDay > 5) {
      score -= 5; // Heavy overtrading
    } else if (tradesPerDay > 3) {
      score -= 3;
    } else if (tradesPerDay > 2) {
      score -= 1;
    }

    return Math.max(0, Math.min(25, score));
  }

  private calculateRealizedEdge(walletData: WalletData): number {
    // 3. Realized Edge (30 points)
    // - Win rate on closed positions
    // - Median ROI percentage
    // - Tail loss exposure
    // - Profit factor ratio

    const closedPositions = walletData.closedPositions || [];
    const pnlSummary = walletData.pnlSummary;

    if (closedPositions.length === 0) {
      return 0;
    }

    let score = 0;

    // Win rate (max 10 points)
    const winRate = pnlSummary?.win_rate || 0;
    if (winRate >= 0.7) {
      score += 10;
    } else if (winRate >= 0.6) {
      score += 8;
    } else if (winRate >= 0.5) {
      score += 6;
    } else if (winRate >= 0.4) {
      score += 4;
    } else if (winRate >= 0.3) {
      score += 2;
    }

    // Median ROI percentage (max 10 points)
    const rois = closedPositions
      .map(p => p.roi_percent_realised || 0)
      .filter(r => !isNaN(r) && isFinite(r))
      .sort((a, b) => a - b);
    
    if (rois.length > 0) {
      const medianRoi = rois[Math.floor(rois.length / 2)];
      
      if (medianRoi >= 50) {
        score += 10;
      } else if (medianRoi >= 30) {
        score += 8;
      } else if (medianRoi >= 20) {
        score += 6;
      } else if (medianRoi >= 10) {
        score += 4;
      } else if (medianRoi >= 0) {
        score += 2;
      }
    }

    // Tail loss exposure (max 5 points)
    // Calculate worst losses
    const losses = rois.filter(r => r < 0);
    if (losses.length > 0) {
      const worstLoss = Math.min(...losses);
      const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
      
      // Penalize extreme tail losses
      if (worstLoss >= -20 && avgLoss >= -10) {
        score += 5; // Controlled losses
      } else if (worstLoss >= -40 && avgLoss >= -20) {
        score += 3;
      } else if (worstLoss >= -60 && avgLoss >= -30) {
        score += 1;
      }
      // No points for extreme losses (>-60%)
    }

    // Profit factor ratio (max 5 points)
    // Profit factor = total profit / total loss
    const totalProfit = closedPositions
      .filter(p => p.pnl_usd_realised > 0)
      .reduce((sum, p) => sum + p.pnl_usd_realised, 0);
    
    const totalLoss = Math.abs(
      closedPositions
        .filter(p => p.pnl_usd_realised < 0)
        .reduce((sum, p) => sum + p.pnl_usd_realised, 0)
    );

    if (totalLoss > 0) {
      const profitFactor = totalProfit / totalLoss;
      
      if (profitFactor >= 3) {
        score += 5;
      } else if (profitFactor >= 2) {
        score += 4;
      } else if (profitFactor >= 1.5) {
        score += 3;
      } else if (profitFactor >= 1) {
        score += 2;
      } else if (profitFactor >= 0.8) {
        score += 1;
      }
    } else if (totalProfit > 0) {
      // Only profits, no losses
      score += 5;
    }

    return Math.max(0, Math.min(30, score));
  }

  private calculateBehaviorQuality(walletData: WalletData): number {
    // 4. Behavior Quality (15 points)
    // - Asset diversity
    // - Scam and rug exposure penalty
    // - Wallet age and continuity

    let score = 0;

    // Asset diversity (max 5 points)
    const distinctAssets = walletData.distinctAssets || 0;
    if (distinctAssets >= 20) {
      score += 5;
    } else if (distinctAssets >= 15) {
      score += 4;
    } else if (distinctAssets >= 10) {
      score += 3;
    } else if (distinctAssets >= 5) {
      score += 2;
    } else if (distinctAssets >= 3) {
      score += 1;
    }

    // Scam and rug exposure penalty (max 5 points deduction)
    // This would require additional data from Nansen labels or known scam token lists
    // For now, we'll use a heuristic based on token performance
    const pnlDetails = walletData.pnlDetails || [];
    const extremeLosses = pnlDetails.filter(
      p => p.roi_percent_realised < -80 && p.sold_usd > 100
    ).length;
    
    const totalPositions = pnlDetails.length;
    if (totalPositions > 0) {
      const rugExposure = extremeLosses / totalPositions;
      if (rugExposure > 0.2) {
        score -= 5; // High rug exposure
      } else if (rugExposure > 0.1) {
        score -= 3;
      } else if (rugExposure > 0.05) {
        score -= 1;
      }
    }

    // Wallet age and continuity (max 5 points)
    const walletAge = walletData.walletAge || 0;
    if (walletAge >= 365) {
      score += 5;
    } else if (walletAge >= 180) {
      score += 4;
    } else if (walletAge >= 120) {
      score += 3;
    } else if (walletAge >= 90) {
      score += 2;
    } else if (walletAge >= 60) {
      score += 1;
    }

    // Continuity: check for gaps in activity
    const transactions = walletData.transactions || [];
    if (transactions.length >= 2) {
      const firstTx = new Date(transactions[0].block_timestamp).getTime();
      const lastTx = new Date(transactions[transactions.length - 1].block_timestamp).getTime();
      const activeDays = (lastTx - firstTx) / (1000 * 60 * 60 * 24);
      const continuityRatio = activeDays / walletAge;
      
      if (continuityRatio > 0.8) {
        // Good continuity - no significant gaps
        // Already accounted in wallet age score
      } else if (continuityRatio < 0.3) {
        // Poor continuity - large gaps
        score -= 2;
      }
    }

    return Math.max(0, Math.min(15, score));
  }
}
