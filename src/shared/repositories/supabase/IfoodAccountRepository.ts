import { supabase } from "@/shared/lib/supabase";
import { invokeFunction } from "@/shared/lib/api";
import type { IIfoodAccountRepository, IfoodAccountFilters } from "../interfaces/IIfoodAccountRepository";
import type { IfoodAccount, IfoodAccountAccess, ConnectIfoodAccountInput } from "@/entities/ifood-account";

export class SupabaseIfoodAccountRepository implements IIfoodAccountRepository {
  async getAll(filters?: IfoodAccountFilters): Promise<IfoodAccount[]> {
    let query = supabase
      .from("ifood_accounts")
      .select("id, name, merchant_id, is_active, token_expires_at, last_sync_at, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getById(id: string): Promise<IfoodAccount | null> {
    const { data, error } = await supabase
      .from("ifood_accounts")
      .select("id, name, merchant_id, is_active, token_expires_at, last_sync_at, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async getAccessList(accountId: string): Promise<IfoodAccountAccess[]> {
    const { data, error } = await supabase
      .from("ifood_account_access")
      .select("*")
      .eq("ifood_account_id", accountId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async connect(input: ConnectIfoodAccountInput): Promise<IfoodAccount> {
    const { data, error } = await invokeFunction<{ success: boolean; account: IfoodAccount }>(
      "ifood-connect",
      {
        name: input.name,
        merchant_id: input.merchant_id,
        client_id: input.client_id,
        client_secret: input.client_secret,
      },
    );

    if (error) throw new Error(error);
    return data!.account;
  }

  async refreshToken(accountId: string): Promise<void> {
    const { error } = await invokeFunction("ifood-refresh-token", {
      account_id: accountId,
    });

    if (error) throw new Error(error);
  }

  async syncRestaurants(accountId: string): Promise<void> {
    const { error } = await invokeFunction("ifood-sync-restaurants", {
      account_id: accountId,
    });

    if (error) throw new Error(error);
  }

  async collectData(accountId: string): Promise<void> {
    const { error } = await invokeFunction("ifood-collect-data", {
      account_id: accountId,
    });

    if (error) throw new Error(error);
  }

  async grantAccess(accountId: string, userId: string): Promise<IfoodAccountAccess> {
    const { data, error } = await supabase
      .from("ifood_account_access")
      .insert({ ifood_account_id: accountId, user_id: userId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async revokeAccess(accountId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("ifood_account_access")
      .delete()
      .eq("ifood_account_id", accountId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from("ifood_accounts")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async reactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from("ifood_accounts")
      .update({ is_active: true })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}
