import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../database/data-connect.service';

@Injectable()
export class InviteCodeService {
  private readonly ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

  constructor(private readonly dataConnect: DataConnectService) {}

  async generateInviteCode(createdBy?: string, sourceKol?: string): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      code = this.generateRandomCode();
      const existing = await this.dataConnect.findInviteCodeByCode(code);
      exists = !!existing;
    }

    await this.dataConnect.insertInviteCode({
      code,
      createdByUserId: createdBy ?? null,
      sourceKol: sourceKol ?? null,
    });
    return code;
  }

  async getInviteStats(inviteCode: string) {
    const referralTree = await this.getReferralTree(inviteCode.toUpperCase());

    const totalSubmissions = referralTree.length;
    const eligibleCount = referralTree.filter((u) => u.eligibility).length;
    const eligibilityRate = totalSubmissions > 0 ? eligibleCount / totalSubmissions : 0;

    const rankDistribution: Record<string, number> = {};
    referralTree.forEach((user: Record<string, unknown>) => {
      const rank = String(user.rank ?? '');
      rankDistribution[rank] = (rankDistribution[rank] || 0) + 1;
    });

    const depth = this.calculateReferralDepth(inviteCode.toUpperCase(), referralTree);

    const referrerCounts: Record<string, number> = {};
    referralTree.forEach((user: Record<string, unknown>) => {
      const uid = user.id as string;
      if (user.inviteCodeIssued && uid) {
        referrerCounts[uid] = (referrerCounts[uid] || 0) + 1;
      }
    });

    const topReferrers = Object.entries(referrerCounts)
      .map(([userId, referrals]) => ({ userId, referrals }))
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, 10);

    return {
      inviteCode: inviteCode.toUpperCase(),
      totalSubmissions,
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

  private async getReferralTree(rootInviteCode: string): Promise<Record<string, unknown>[]> {
    const directRefs = await this.dataConnect.findUsersByReferredByInviteCode(rootInviteCode);
    let all: Record<string, unknown>[] = [...directRefs];

    for (const user of directRefs) {
      const issued = user.inviteCodeIssued as string | undefined;
      if (issued) {
        const indirect = await this.getReferralTree(issued);
        all = [...all, ...indirect];
      }
    }
    return all;
  }

  private calculateReferralDepth(rootInviteCode: string, referralTree: Record<string, unknown>[]): number {
    const codeToUser = new Map<string, Record<string, unknown>>();
    referralTree.forEach((u) => {
      const code = u.inviteCodeIssued as string | undefined;
      if (code) codeToUser.set(code, u);
    });

    let maxDepth = 0;
    const calc = (code: string, d: number): number => {
      const user = codeToUser.get(code);
      if (!user || !user.inviteCodeIssued) return d;
      return calc(user.inviteCodeIssued as string, d + 1);
    };

    referralTree.forEach((u) => {
      if (u.referredByInviteCode === rootInviteCode && u.inviteCodeIssued) {
        maxDepth = Math.max(maxDepth, calc(u.inviteCodeIssued as string, 1));
      }
    });
    return maxDepth;
  }
}
