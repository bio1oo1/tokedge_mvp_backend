import { Injectable, NotFoundException } from '@nestjs/common';
import { DataConnectService } from '../database/data-connect.service';
import { Rank } from '../common/enums/rank.enum';
import { EventType } from '../common/enums/event-type.enum';
import { WalletScoringService } from './wallet-scoring.service';
import { InviteCodeService } from '../invite/invite-code.service';
import { NansenService, WalletData } from './nansen.service';
import { CacheService } from '../common/cache.service';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  private readonly WALLET_DATA_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

  constructor(
    private readonly dataConnect: DataConnectService,
    private readonly walletScoringService: WalletScoringService,
    private readonly inviteCodeService: InviteCodeService,
    private readonly nansenService: NansenService,
    private readonly cacheService: CacheService,
  ) {}

  async analyzeWallet(
    walletAddress: string,
    inviteCode: string,
    utm?: Record<string, string>,
    clientMeta?: Record<string, any>,
  ) {
    const validInvite = await this.dataConnect.findInviteCodeByCode(inviteCode);
    if (!validInvite) {
      throw new NotFoundException('Invalid invite code');
    }
    const validInviteCode = validInvite.code;

    const walletHash = crypto
      .createHash('sha256')
      .update(walletAddress.toLowerCase())
      .digest('hex');

    let user = await this.dataConnect.findUserByWalletHash(walletHash) as Record<string, any> | null;
    let userId: string;

    if (user) {
      userId = user.id as string;
    } else {
      // Check cache first
      const cacheKey = `wallet_data:${walletHash}`;
      let cachedWalletData = this.cacheService.get<WalletData>(cacheKey);
      
      // Fetch wallet data (from cache or Nansen)
      const walletData: WalletData = cachedWalletData 
        ? cachedWalletData
        : await this.nansenService.fetchWalletData(walletAddress);
      
      // Cache if we just fetched it
      if (!cachedWalletData) {
        this.cacheService.set(cacheKey, walletData, this.WALLET_DATA_CACHE_TTL);
      }

      const scoringResult = await this.walletScoringService.scoreWallet(
        walletAddress,
        walletData,
      );
      const rank = this.determineRank(scoringResult);
      const eligibility = scoringResult.score >= 70 && scoringResult.meetsMinimumThresholds;

      const insertRes = await this.dataConnect.insertUser({
        walletAddress: walletAddress.toLowerCase(),
        walletAddressHash: walletHash,
        inviteCodeIssued: null,
        referredByInviteCode: validInviteCode,
        rank,
        score: scoringResult.score,
        eligibility,
        utmSource: utm?.source ?? null,
        utmMedium: utm?.medium ?? null,
        utmCampaign: utm?.campaign ?? null,
        gaClientId: clientMeta?.gaClientId ?? null,
      });
      userId = insertRes.id;

      let newInviteCode: string | null = null;
      if (eligibility) {
        newInviteCode = await this.inviteCodeService.generateInviteCode(userId);
        await this.dataConnect.updateUserInviteCodeIssued(userId, newInviteCode);
      }

      await this.dataConnect.insertPortfolioSnapshot(userId, walletData as unknown as Record<string, unknown>);
      await this.dataConnect.insertEvent(userId, EventType.WALLET_ANALYZED, {
        inviteCode: validInviteCode,
        score: scoringResult.score,
        rank,
        eligibility,
      });
    }

    user = (user ?? (await this.dataConnect.findUserById(userId))) as Record<string, any>;
    
    // Get scoring result for metrics (re-score to get detailed metrics)
    const cacheKey = `wallet_data:${walletHash}`;
    let walletData: WalletData | null = this.cacheService.get<WalletData>(cacheKey);
    
    if (!walletData) {
      // If not cached, fetch fresh data
      walletData = await this.nansenService.fetchWalletData(walletAddress);
      this.cacheService.set(cacheKey, walletData, this.WALLET_DATA_CACHE_TTL);
    }
    
    const scoringResult = await this.walletScoringService.scoreWallet(
      walletAddress,
      walletData,
    );
    
    // Generate deterministic shareCardId based on userId (same user = same shareCardId)
    // Using a deterministic UUID v5 approach: hash userId to create consistent shareCardId
    const shareCardId = this.generateShareCardId(userId);

    return {
      userId: user.id,
      rank: user.rank,
      score: user.score,
      eligibility: user.eligibility,
      metricsSummary: {
        holdingConviction: Math.round(scoringResult.metrics.holdingConviction),
        tradingDiscipline: Math.round(scoringResult.metrics.tradingDiscipline),
        realizedEdge: Math.round(scoringResult.metrics.realizedEdge),
        behaviorQuality: Math.round(scoringResult.metrics.behaviorQuality),
        traits: this.getTraitsForRank(user.rank as Rank),
      },
      shareCardId,
    };
  }

  async getPortfolio(userId: string) {
    const snapshot = await this.dataConnect.findLatestPortfolioSnapshotByUserId(userId);
    if (!snapshot) {
      throw new NotFoundException('Portfolio not found');
    }
    return {
      userId,
      portfolio: snapshot.snapshotJson,
      snapshotDate: new Date(snapshot.createdAt),
    };
  }


  private determineRank(scoringResult: any): Rank {
    const { score } = scoringResult;
    if (score < 70 || !scoringResult.meetsMinimumThresholds) {
      if (scoringResult.insufficientData) return Rank.INSUFFICIENT_DATA;
      if (scoringResult.extremeChurn && scoringResult.poorEdge) return Rank.JEETER;
      return Rank.PAPER_HANDS;
    }
    if (scoringResult.highConviction && scoringResult.positiveEdge && !scoringResult.panicSelling) {
      return Rank.SMART_MONEY;
    }
    if (scoringResult.highConviction && scoringResult.positiveEdge) {
      return Rank.DIAMOND_HANDS;
    }
    if (scoringResult.strongEdge && scoringResult.higherChurn) {
      return Rank.DEGENERATE;
    }
    return Rank.PAPER_HANDS;
  }

  private getTraitsForRank(rank: Rank): string[] {
    const traitsMap: Record<Rank, string[]> = {
      [Rank.SMART_MONEY]: ['Holds winners', 'Trades with discipline', 'Avoids rugs'],
      [Rank.DIAMOND_HANDS]: ['Holds winners', 'High conviction'],
      [Rank.DEGENERATE]: ['Strong edge', 'Higher churn'],
      [Rank.PAPER_HANDS]: ['Sells too early', 'Low conviction'],
      [Rank.JEETER]: ['Overtrades', 'Poor edge'],
      [Rank.INSUFFICIENT_DATA]: [],
    };
    return traitsMap[rank] || [];
  }

  /**
   * Generate a deterministic shareCardId from userId.
   * Same userId always produces the same shareCardId.
   * Uses SHA-256 hash of userId with a namespace, formatted as UUID-like string.
   */
  private generateShareCardId(userId: string): string {
    // Use a fixed namespace for shareCardId generation
    const namespace = 'tokedge-sharecard-namespace';
    const hash = crypto.createHash('sha256');
    hash.update(namespace + userId);
    const hashHex = hash.digest('hex');
    
    // Format first 32 chars as UUID-like string (8-4-4-4-12)
    return [
      hashHex.substring(0, 8),
      hashHex.substring(8, 12),
      hashHex.substring(12, 16),
      hashHex.substring(16, 20),
      hashHex.substring(20, 32),
    ].join('-');
  }
}
