import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class AnalyzeWalletDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  inviteCode: string;

  @IsOptional()
  @IsObject()
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };

  @IsOptional()
  @IsObject()
  clientMeta?: {
    userAgent?: string;
    ip?: string;
    gaClientId?: string;
  };
}
