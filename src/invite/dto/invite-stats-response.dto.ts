export class InviteStatsResponseDto {
  inviteCode: string;
  totalSubmissions: number;
  eligibilityRate: number;
  rankDistribution: Record<string, number>;
  referralDepth: number;
  topReferrers: Array<{
    userId: string;
    referrals: number;
  }>;
}
