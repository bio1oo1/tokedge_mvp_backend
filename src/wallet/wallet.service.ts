import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Rank } from '../common/enums/rank.enum';
import { EventType } from '../common/enums/event-type.enum';
import { WalletScoringService } from './wallet-scoring.service';
import { InviteCodeService } from '../invite/invite-code.service';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly walletScoringService: WalletScoringService,
    private readonly inviteCodeService: InviteCodeService,
  ) {}

  async analyzeWallet(
    walletAddress: string,
    inviteCode: string,
    utm?: Record<string, any>,
    clientMeta?: Record<string, any>,
  ) {
    const pgPool = this.databaseService.getPgPool();

    // Validate invite code exists
    const inviteCodeResult = await pgPool.query(
      'SELECT id, code FROM invite_codes WHERE UPPER(code) = UPPER($1)',
      [inviteCode],
    );

    if (inviteCodeResult.rows.length === 0) {
      throw new NotFoundException('Invalid invite code');
    }

    const validInviteCode = inviteCodeResult.rows[0].code;

    // Hash wallet address for lookup
    const walletHash = crypto
      .createHash('sha256')
      .update(walletAddress.toLowerCase())
      .digest('hex');

    // Check if user already exists
    let userResult = await pgPool.query(
      'SELECT * FROM users WHERE wallet_address_hash = $1',
      [walletHash],
    );

    let userId: string;
    let isNewUser = false;

    if (userResult.rows.length > 0) {
      // Existing user - return cached result
      userId = userResult.rows[0].id;
    } else {
      // New user - analyze wallet
      isNewUser = true;

      // Fetch wallet data (this would integrate with third-party wallet intelligence provider)
      const walletData = await this.fetchWalletData(walletAddress);

      // Score wallet
      const scoringResult = await this.walletScoringService.scoreWallet(
        walletAddress,
        walletData,
      );

      // Determine rank from score
      const rank = this.determineRank(scoringResult);
      const eligibility = scoringResult.score >= 70 && scoringResult.meetsMinimumThresholds;

      // Create user record first (without invite code)
      const insertResult = await pgPool.query(
        `INSERT INTO users (
          wallet_address, wallet_address_hash, invite_code_issued,
          referred_by_invite_code, rank, score, eligibility,
          utm_source, utm_medium, utm_campaign, ga_client_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          walletAddress.toLowerCase(), // Store normalized
          walletHash,
          null, // Will update after generating invite code
          validInviteCode,
          rank,
          scoringResult.score,
          eligibility,
          utm?.source || null,
          utm?.medium || null,
          utm?.campaign || null,
          clientMeta?.gaClientId || null,
        ],
      );

      userId = insertResult.rows[0].id;

      // Generate invite code for eligible users
      let newInviteCode: string | null = null;
      if (eligibility) {
        newInviteCode = await this.inviteCodeService.generateInviteCode(userId);
        
        // Update user with invite code
        await pgPool.query(
          'UPDATE users SET invite_code_issued = $1 WHERE id = $2',
          [newInviteCode, userId],
        );
      }


      // Create portfolio snapshot
      await pgPool.query(
        'INSERT INTO portfolio_snapshots (user_id, snapshot_json) VALUES ($1, $2)',
        [userId, JSON.stringify(walletData)],
      );

      // Log event
      await pgPool.query(
        'INSERT INTO events (user_id, event_type, metadata) VALUES ($1, $2, $3)',
        [
          userId,
          EventType.WALLET_ANALYZED,
          JSON.stringify({
            inviteCode: validInviteCode,
            score: scoringResult.score,
            rank,
            eligibility,
          }),
        ],
      );
    }

    // Get user data
    const user = userResult.rows[0] || (await pgPool.query('SELECT * FROM users WHERE id = $1', [userId])).rows[0];

    // Generate sharecard ID
    const shareCardId = crypto.randomUUID();

    return {
      userId: user.id,
      rank: user.rank,
      score: user.score,
      eligibility: user.eligibility,
      metricsSummary: {
        holdingConviction: 0, // Would be populated from scoring service
        tradingDiscipline: 0,
        realizedEdge: 0,
        behaviorQuality: 0,
        traits: this.getTraitsForRank(user.rank),
      },
      shareCardId,
    };
  }

  async getPortfolio(userId: string) {
    const pgPool = this.databaseService.getPgPool();

    const result = await pgPool.query(
      'SELECT * FROM portfolio_snapshots WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Portfolio not found');
    }

    const snapshot = result.rows[0];

    return {
      userId,
      portfolio: snapshot.snapshot_json,
      snapshotDate: snapshot.created_at,
    };
  }

  private async fetchWalletData(walletAddress: string): Promise<Record<string, any>> {
    // TODO: Integrate with third-party wallet intelligence provider
    // This would fetch:
    // - ERC20 balances and transfers
    // - DEX swaps and trade history
    // - Token price history
    // - Stablecoin flows
    // - DeFi positions
    
    // Placeholder implementation
    return {
      address: walletAddress,
      // Mock data structure
    };
  }

  private determineRank(scoringResult: any): Rank {
    const { score, metrics } = scoringResult;

    if (score < 70 || !scoringResult.meetsMinimumThresholds) {
      if (metrics.insufficientData) {
        return Rank.INSUFFICIENT_DATA;
      }
      if (metrics.extremeChurn && metrics.poorEdge) {
        return Rank.JEETER;
      }
      return Rank.PAPER_HANDS;
    }

    if (metrics.highConviction && metrics.positiveEdge && !metrics.panicSelling) {
      return Rank.SMART_MONEY;
    }

    if (metrics.highConviction && metrics.positiveEdge) {
      return Rank.DIAMOND_HANDS;
    }

    if (metrics.strongEdge && metrics.higherChurn) {
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
}
