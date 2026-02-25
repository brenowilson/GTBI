import type { IfoodAccount, IfoodAccountAccess, ConnectIfoodAccountInput } from "@/entities/ifood-account";

export interface IfoodAccountFilters {
  isActive?: boolean;
}

export interface IfoodUserCodeResponse {
  userCode: string;
  verificationUrl: string;
  authorizationCodeVerifier: string;
  expiresIn: number;
}

export interface IIfoodAccountRepository {
  getAll(filters?: IfoodAccountFilters): Promise<IfoodAccount[]>;
  getById(id: string): Promise<IfoodAccount | null>;
  getAccessList(accountId: string): Promise<IfoodAccountAccess[]>;
  requestCode(): Promise<IfoodUserCodeResponse>;
  connect(data: ConnectIfoodAccountInput & { authorization_code_verifier: string }): Promise<IfoodAccount>;
  refreshToken(accountId: string): Promise<void>;
  syncRestaurants(accountId: string): Promise<void>;
  collectData(restaurantId: string, weekStart: string, weekEnd: string): Promise<void>;
  grantAccess(accountId: string, userId: string): Promise<IfoodAccountAccess>;
  revokeAccess(accountId: string, userId: string): Promise<void>;
  addManually(data: ConnectIfoodAccountInput): Promise<IfoodAccount>;
  deactivate(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
}
