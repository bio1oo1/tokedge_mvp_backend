import { Injectable, NotFoundException } from '@nestjs/common';
import { DataConnectService } from '../database/data-connect.service';
import { Rank } from '../common/enums/rank.enum';
import { EventType } from '../common/enums/event-type.enum';
import { WalletScoringService } from './wallet-scoring.service';
import { InviteCodeService } from '../invite/invite-code.service';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  constructor(
    private readonly dataConnect: DataConnectService,
    private readonly walletScoringService: WalletScoringService,
    private readonly inviteCodeService: InviteCodeService,
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
      const walletData = await this.fetchWalletData(walletAddress);
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

      await this.dataConnect.insertPortfolioSnapshot(userId, walletData);
      await this.dataConnect.insertEvent(userId, EventType.WALLET_ANALYZED, {
        inviteCode: validInviteCode,
        score: scoringResult.score,
        rank,
        eligibility,
      });
    }

    user = (user ?? (await this.dataConnect.findUserById(userId))) as Record<string, any>;
    const shareCardId = crypto.randomUUID();

    return {
      userId: user.id,
      rank: user.rank,
      score: user.score,
      eligibility: user.eligibility,
      metricsSummary: {
        holdingConviction: 0,
        tradingDiscipline: 0,
        realizedEdge: 0,
        behaviorQuality: 0,
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

  private async fetchWalletData(walletAddress: string): Promise<Record<string, any>> {
    return {
      address: walletAddress,
    };
  }

  private determineRank(scoringResult: any): Rank {
    const { score, metrics } = scoringResult;
    if (score < 70 || !scoringResult.meetsMinimumThresholds) {
      if (metrics.insufficientData) return Rank.INSUFFICIENT_DATA;
      if (metrics.extremeChurn && metrics.poorEdge) return Rank.JEETER;
      return Rank.PAPER_HANDS;
    }
    if (metrics.highConviction && metrics.positiveEdge && !metrics.panicSelling) return Rank.SMART_MONEY;
    if (metrics.highConviction && metrics.positiveEdge) return Rank.DIAMOND_HANDS;
    if (metrics.strongEdge && metrics.higherChurn) return Rank.DEGENERATE;
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
}
