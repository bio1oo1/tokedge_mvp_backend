import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { getDataConnect, type DataConnect, type ConnectorConfig } from 'firebase-admin/data-connect';
import {
  connectorConfig as generatedConnectorConfig,
  findInviteCodeByCode as generatedFindInviteCodeByCode,
  insertInviteCode as generatedInsertInviteCode,
  findUserByWalletHash as generatedFindUserByWalletHash,
  findUserById as generatedFindUserById,
  findUsersByReferredByInviteCode as generatedFindUsersByReferredByInviteCode,
  insertUser as generatedInsertUser,
  updateUserInviteCodeIssued as generatedUpdateUserInviteCodeIssued,
  findLatestPortfolioByUserId as generatedFindLatestPortfolioByUserId,
  insertPortfolioSnapshot as generatedInsertPortfolioSnapshot,
  insertEvent as generatedInsertEvent,
} from '@tokedge/dataconnect-generated';

/**
 * Data access layer over Firebase Data Connect (Firebase Postgres).
 * Uses the generated admin SDK from firebase dataconnect:sdk:generate.
 */
@Injectable()
export class DataConnectService implements OnModuleInit {
  private dc: DataConnect;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const firebaseConfig = this.configService.get('firebase');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
      });
    }

    this.dc = getDataConnect(generatedConnectorConfig);
  }

  getDataConnect(): DataConnect {
    return this.dc;
  }

  getConnectorConfig(): ConnectorConfig {
    return generatedConnectorConfig;
  }

  async findInviteCodeByCode(code: string): Promise<{ id: string; code: string } | null> {
    const res = await generatedFindInviteCodeByCode(this.dc, { code: code.toUpperCase() });
    const row = res.data?.inviteCodes?.[0];
    return row ? { id: row.id, code: row.code } : null;
  }

  async insertInviteCode(data: {
    code: string;
    createdByUserId?: string | null;
    sourceKol?: string | null;
  }): Promise<{ id: string }> {
    await generatedInsertInviteCode(this.dc, {
      code: data.code,
      createdByUserId: data.createdByUserId ?? undefined,
      sourceKol: data.sourceKol ?? undefined,
    });
    return { id: '' };
  }

  async findUserByWalletHash(walletAddressHash: string): Promise<Record<string, unknown> | null> {
    const res = await generatedFindUserByWalletHash(this.dc, { hash: walletAddressHash });
    const row = res.data?.users?.[0];
    return (row as unknown as Record<string, unknown>) ?? null;
  }

  async findUserById(userId: string): Promise<Record<string, unknown> | null> {
    const res = await generatedFindUserById(this.dc, { id: userId });
    return (res.data?.user as unknown as Record<string, unknown>) ?? null;
  }

  async insertUser(data: {
    walletAddress: string;
    walletAddressHash: string;
    inviteCodeIssued: string | null;
    referredByInviteCode: string;
    rank: string;
    score: number;
    eligibility: boolean;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    gaClientId?: string | null;
  }): Promise<{ id: string }> {
    await generatedInsertUser(this.dc, {
      walletAddress: data.walletAddress,
      walletAddressHash: data.walletAddressHash,
      inviteCodeIssued: data.inviteCodeIssued ?? undefined,
      referredByInviteCode: data.referredByInviteCode,
      rank: data.rank,
      score: data.score,
      eligibility: data.eligibility,
      shareCompleted: false,
      utmSource: data.utmSource ?? undefined,
      utmMedium: data.utmMedium ?? undefined,
      utmCampaign: data.utmCampaign ?? undefined,
      gaClientId: data.gaClientId ?? undefined,
    });
    const existing = await this.findUserByWalletHash(data.walletAddressHash);
    return { id: (existing?.id as string) ?? '' };
  }

  async updateUserInviteCodeIssued(userId: string, inviteCodeIssued: string): Promise<void> {
    await generatedUpdateUserInviteCodeIssued(this.dc, { id: userId, inviteCodeIssued });
  }

  async insertPortfolioSnapshot(userId: string, snapshotJson: Record<string, unknown>): Promise<void> {
    await generatedInsertPortfolioSnapshot(this.dc, {
      userId,
      snapshotJson: JSON.stringify(snapshotJson),
    });
  }

  async findLatestPortfolioSnapshotByUserId(userId: string): Promise<{
    id: string;
    snapshotJson: Record<string, unknown>;
    createdAt: string;
  } | null> {
    const res = await generatedFindLatestPortfolioByUserId(this.dc, { userId });
    const row = res.data?.portfolioSnapshots?.[0];
    if (!row) return null;
    return {
      id: row.id,
      snapshotJson: (typeof row.snapshotJson === 'string'
        ? JSON.parse(row.snapshotJson)
        : row.snapshotJson) as Record<string, unknown>,
      createdAt: row.createdAt,
    };
  }

  async insertEvent(
    userId: string | null,
    eventType: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await generatedInsertEvent(this.dc, {
      userId: userId ?? undefined,
      eventType,
      metadata: JSON.stringify(metadata),
    });
  }

  async findUsersByReferredByInviteCode(inviteCode: string): Promise<Array<Record<string, unknown>>> {
    const res = await generatedFindUsersByReferredByInviteCode(this.dc, { code: inviteCode });
    return (res.data?.users as unknown as Array<Record<string, unknown>>) ?? [];
  }
}
