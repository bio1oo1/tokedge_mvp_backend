import { Rank } from '../../common/enums/rank.enum';

export class User {
  id: string;
  wallet_address: string; // Restricted or encrypted
  wallet_address_hash: string;
  invite_code_issued: string | null;
  referred_by_invite_code: string | null;
  rank: Rank;
  score: number;
  eligibility: boolean;
  share_completed: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ga_client_id: string | null;
  created_at: Date;
}
