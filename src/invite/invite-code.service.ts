import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class InviteCodeService {
  // Alphabet: A-Z excluding I and O
  private readonly ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

  constructor(private readonly databaseService: DatabaseService) {}

  async generateInviteCode(createdBy?: string, sourceKol?: string): Promise<string> {
    const pgPool = this.databaseService.getPgPool();
    let code: string;
    let exists = true;

    // Generate unique 8-character code
    while (exists) {
      code = this.generateRandomCode();
      const result = await pgPool.query('SELECT id FROM invite_codes WHERE code = $1', [code]);
      exists = result.rows.length > 0;
    }

    // Insert invite code
    const result = await pgPool.query(
      'INSERT INTO invite_codes (code, created_by, source_kol) VALUES ($1, $2, $3) RETURNING id',
      [code, createdBy || null, sourceKol || null],
    );

    return code;
  }

  async getInviteStats(inviteCode: string) {
    const pgPool = this.databaseService.getPgPool();

    // Get all users referred by this invite code (direct and indirect)
    const referralTree = await this.getReferralTree(inviteCode, pgPool);

    const totalSubmissions = referralTree.length;
    const eligibleCount = referralTree.filter((u) => u.eligibility).length;
    const eligibilityRate = totalSubmissions > 0 ? eligibleCount / totalSubmissions : 0;

    // Rank distribution
    const rankDistribution: Record<string, number> = {};
    referralTree.forEach((user) => {
      rankDistribution[user.rank] = (rankDistribution[user.rank] || 0) + 1;
    });

    // Calculate referral depth
    const depth = this.calculateReferralDepth(inviteCode, referralTree);

    // Top referrers
    const referrerCounts: Record<string, number> = {};
    referralTree.forEach((user) => {
      if (user.invite_code_issued) {
        referrerCounts[user.id] = (referrerCounts[user.id] || 0) + 1;
      }
    });

    const topReferrers = Object.entries(referrerCounts)
      .map(([userId, count]) => ({ userId, referrals: count }))
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, 10);

    return {
      inviteCode,
      totalSubmissions: totalSubmissions,
      eligibilityRate: Math.round(eligibilityRate * 100) / 100,
      rankDistribution,
      referralDepth: depth,
      topReferrers,
    };
  }

  private generateRandomCode(): string {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += this.ALPHABET[Math.floor(Math.random() * this.ALPHABET.length)];
    }
    return code;
  }

  private async getReferralTree(
    rootInviteCode: string,
    pgPool: any,
  ): Promise<any[]> {
    // Get all users directly referred by this code
    const directRefs = await pgPool.query(
      'SELECT * FROM users WHERE referred_by_invite_code = $1',
      [rootInviteCode],
    );

    let allUsers = [...directRefs.rows];

    // Recursively get all indirect referrals
    for (const user of directRefs.rows) {
      if (user.invite_code_issued) {
        const indirectRefs = await this.getReferralTree(user.invite_code_issued, pgPool);
        allUsers = [...allUsers, ...indirectRefs];
      }
    }

    return allUsers;
  }

  private calculateReferralDepth(rootInviteCode: string, referralTree: any[]): number {
    // Build a map of invite codes to users
    const codeToUser = new Map<string, any>();
    referralTree.forEach((user) => {
      if (user.invite_code_issued) {
        codeToUser.set(user.invite_code_issued, user);
      }
    });

    // Find maximum depth
    let maxDepth = 0;

    const calculateDepth = (code: string, currentDepth: number): number => {
      const user = codeToUser.get(code);
      if (!user || !user.invite_code_issued) {
        return currentDepth;
      }
      return calculateDepth(user.invite_code_issued, currentDepth + 1);
    };

    referralTree.forEach((user) => {
      if (user.referred_by_invite_code === rootInviteCode && user.invite_code_issued) {
        const depth = calculateDepth(user.invite_code_issued, 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    });

    return maxDepth;
  }
}
