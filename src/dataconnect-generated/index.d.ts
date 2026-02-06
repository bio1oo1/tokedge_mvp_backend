import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface Event_Key {
  id: UUIDString;
  __typename?: 'Event_Key';
}

export interface FindInviteCodeByCodeData {
  inviteCodes: ({
    id: UUIDString;
    code: string;
  } & InviteCode_Key)[];
}

export interface FindInviteCodeByCodeVariables {
  code: string;
}

export interface FindLatestPortfolioByUserIdData {
  portfolioSnapshots: ({
    id: UUIDString;
    snapshotJson: string;
    createdAt: TimestampString;
  } & PortfolioSnapshot_Key)[];
}

export interface FindLatestPortfolioByUserIdVariables {
  userId: UUIDString;
}

export interface FindUserByIdData {
  user?: {
    id: UUIDString;
    walletAddress: string;
    walletAddressHash: string;
    inviteCodeIssued?: string | null;
    referredByInviteCode?: string | null;
    rank: string;
    score: number;
    eligibility: boolean;
    shareCompleted: boolean;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    gaClientId?: string | null;
    createdAt: TimestampString;
  } & User_Key;
}

export interface FindUserByIdVariables {
  id: UUIDString;
}

export interface FindUserByWalletHashData {
  users: ({
    id: UUIDString;
    walletAddress: string;
    walletAddressHash: string;
    inviteCodeIssued?: string | null;
    referredByInviteCode?: string | null;
    rank: string;
    score: number;
    eligibility: boolean;
    shareCompleted: boolean;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    gaClientId?: string | null;
    createdAt: TimestampString;
  } & User_Key)[];
}

export interface FindUserByWalletHashVariables {
  hash: string;
}

export interface FindUsersByReferredByInviteCodeData {
  users: ({
    id: UUIDString;
    inviteCodeIssued?: string | null;
    referredByInviteCode?: string | null;
    rank: string;
    eligibility: boolean;
  } & User_Key)[];
}

export interface FindUsersByReferredByInviteCodeVariables {
  code: string;
}

export interface InsertEventData {
  event_insert: Event_Key;
}

export interface InsertEventVariables {
  userId?: UUIDString | null;
  eventType: string;
  metadata?: string | null;
}

export interface InsertInviteCodeData {
  inviteCode_insert: InviteCode_Key;
}

export interface InsertInviteCodeVariables {
  code: string;
  createdByUserId?: UUIDString | null;
  sourceKol?: string | null;
}

export interface InsertPortfolioSnapshotData {
  portfolioSnapshot_insert: PortfolioSnapshot_Key;
}

export interface InsertPortfolioSnapshotVariables {
  userId: UUIDString;
  snapshotJson: string;
}

export interface InsertUserData {
  user_insert: User_Key;
}

export interface InsertUserVariables {
  walletAddress: string;
  walletAddressHash: string;
  inviteCodeIssued?: string | null;
  referredByInviteCode: string;
  rank: string;
  score: number;
  eligibility: boolean;
  shareCompleted: boolean;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  gaClientId?: string | null;
}

export interface InviteCode_Key {
  id: UUIDString;
  __typename?: 'InviteCode_Key';
}

export interface PortfolioSnapshot_Key {
  id: UUIDString;
  __typename?: 'PortfolioSnapshot_Key';
}

export interface UpdateUserInviteCodeIssuedData {
  user_update?: User_Key | null;
}

export interface UpdateUserInviteCodeIssuedVariables {
  id: UUIDString;
  inviteCodeIssued: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'InsertEvent' Mutation. Allow users to execute without passing in DataConnect. */
export function insertEvent(dc: DataConnect, vars: InsertEventVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertEventData>>;
/** Generated Node Admin SDK operation action function for the 'InsertEvent' Mutation. Allow users to pass in custom DataConnect instances. */
export function insertEvent(vars: InsertEventVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertEventData>>;

/** Generated Node Admin SDK operation action function for the 'FindInviteCodeByCode' Query. Allow users to execute without passing in DataConnect. */
export function findInviteCodeByCode(dc: DataConnect, vars: FindInviteCodeByCodeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FindInviteCodeByCodeData>>;
/** Generated Node Admin SDK operation action function for the 'FindInviteCodeByCode' Query. Allow users to pass in custom DataConnect instances. */
export function findInviteCodeByCode(vars: FindInviteCodeByCodeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FindInviteCodeByCodeData>>;

/** Generated Node Admin SDK operation action function for the 'InsertInviteCode' Mutation. Allow users to execute without passing in DataConnect. */
export function insertInviteCode(dc: DataConnect, vars: InsertInviteCodeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertInviteCodeData>>;
/** Generated Node Admin SDK operation action function for the 'InsertInviteCode' Mutation. Allow users to pass in custom DataConnect instances. */
export function insertInviteCode(vars: InsertInviteCodeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertInviteCodeData>>;

/** Generated Node Admin SDK operation action function for the 'FindLatestPortfolioByUserId' Query. Allow users to execute without passing in DataConnect. */
export function findLatestPortfolioByUserId(dc: DataConnect, vars: FindLatestPortfolioByUserIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FindLatestPortfolioByUserIdData>>;
/** Generated Node Admin SDK operation action function for the 'FindLatestPortfolioByUserId' Query. Allow users to pass in custom DataConnect instances. */
export function findLatestPortfolioByUserId(vars: FindLatestPortfolioByUserIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FindLatestPortfolioByUserIdData>>;

/** Generated Node Admin SDK operation action function for the 'InsertPortfolioSnapshot' Mutation. Allow users to execute without passing in DataConnect. */
export function insertPortfolioSnapshot(dc: DataConnect, vars: InsertPortfolioSnapshotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertPortfolioSnapshotData>>;
/** Generated Node Admin SDK operation action function for the 'InsertPortfolioSnapshot' Mutation. Allow users to pass in custom DataConnect instances. */
export function insertPortfolioSnapshot(vars: InsertPortfolioSnapshotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertPortfolioSnapshotData>>;

/** Generated Node Admin SDK operation action function for the 'FindUserByWalletHash' Query. Allow users to execute without passing in DataConnect. */
export function findUserByWalletHash(dc: DataConnect, vars: FindUserByWalletHashVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FindUserByWalletHashData>>;
/** Generated Node Admin SDK operation action function for the 'FindUserByWalletHash' Query. Allow users to pass in custom DataConnect instances. */
export function findUserByWalletHash(vars: FindUserByWalletHashVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FindUserByWalletHashData>>;

/** Generated Node Admin SDK operation action function for the 'FindUserById' Query. Allow users to execute without passing in DataConnect. */
export function findUserById(dc: DataConnect, vars: FindUserByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FindUserByIdData>>;
/** Generated Node Admin SDK operation action function for the 'FindUserById' Query. Allow users to pass in custom DataConnect instances. */
export function findUserById(vars: FindUserByIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FindUserByIdData>>;

/** Generated Node Admin SDK operation action function for the 'FindUsersByReferredByInviteCode' Query. Allow users to execute without passing in DataConnect. */
export function findUsersByReferredByInviteCode(dc: DataConnect, vars: FindUsersByReferredByInviteCodeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FindUsersByReferredByInviteCodeData>>;
/** Generated Node Admin SDK operation action function for the 'FindUsersByReferredByInviteCode' Query. Allow users to pass in custom DataConnect instances. */
export function findUsersByReferredByInviteCode(vars: FindUsersByReferredByInviteCodeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FindUsersByReferredByInviteCodeData>>;

/** Generated Node Admin SDK operation action function for the 'InsertUser' Mutation. Allow users to execute without passing in DataConnect. */
export function insertUser(dc: DataConnect, vars: InsertUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertUserData>>;
/** Generated Node Admin SDK operation action function for the 'InsertUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function insertUser(vars: InsertUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<InsertUserData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateUserInviteCodeIssued' Mutation. Allow users to execute without passing in DataConnect. */
export function updateUserInviteCodeIssued(dc: DataConnect, vars: UpdateUserInviteCodeIssuedVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateUserInviteCodeIssuedData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateUserInviteCodeIssued' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateUserInviteCodeIssued(vars: UpdateUserInviteCodeIssuedVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateUserInviteCodeIssuedData>>;

