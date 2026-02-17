import type { UserProfile } from "./model";

export const UserRules = {
  canDeactivate(user: UserProfile, targetUser: UserProfile): boolean {
    return user.id !== targetUser.id && user.is_active;
  },

  isActive(user: UserProfile): boolean {
    return user.is_active;
  },
};
