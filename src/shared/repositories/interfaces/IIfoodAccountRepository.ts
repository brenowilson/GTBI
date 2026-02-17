import type { IfoodAccount, IfoodAccountAccess, ConnectIfoodAccountInput } from "@/entities/ifood-account";

export interface IfoodAccountFilters {
  isActive?: boolean;
}

export interface IIfoodAccountRepository {
  getAll(filters?: IfoodAccountFilters): Promise<IfoodAccount[]>;
  getById(id: string): Promise<IfoodAccount | null>;
  getAccessList(accountId: string): Promise<IfoodAccountAccess[]>;
  connect(data: ConnectIfoodAccountInput): Promise<IfoodAccount>;
  refreshToken(accountId: string): Promise<void>;
  syncRestaurants(accountId: string): Promise<void>;
  collectData(accountId: string): Promise<void>;
  grantAccess(accountId: string, userId: string): Promise<IfoodAccountAccess>;
  revokeAccess(accountId: string, userId: string): Promise<void>;
  deactivate(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
}
