import { Rank } from '../../common/enums/rank.enum';

export class AnalyzeWalletResponseDto {
  userId: string;
  rank: Rank;
  score: number;
  eligibility: boolean;
  metricsSummary: {
    holdingConviction: number;
    tradingDiscipline: number;
    realizedEdge: number;
    behaviorQuality: number;
    traits: string[];
  };
  shareCardId: string;
}
