import type { IfoodAccount } from "./model";

export const IfoodAccountRules = {
  isTokenExpired(account: IfoodAccount): boolean {
    if (!account.token_expires_at) return true;
    return new Date(account.token_expires_at) <= new Date();
  },

  needsSync(account: IfoodAccount, maxAgeHours = 24): boolean {
    if (!account.last_sync_at) return true;
    const age = Date.now() - new Date(account.last_sync_at).getTime();
    return age > maxAgeHours * 60 * 60 * 1000;
  },
};
