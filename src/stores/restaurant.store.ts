import { create } from "zustand";
import type { Restaurant } from "@/entities/restaurant";
import type { IfoodAccount } from "@/entities/ifood-account";
import { ifoodAccountRepository } from "@/shared/repositories/supabase";
import { restaurantRepository } from "@/shared/repositories/supabase";

interface RestaurantState {
  selectedAccount: IfoodAccount | null;
  selectedRestaurant: Restaurant | null;
  accounts: IfoodAccount[];
  restaurants: Restaurant[];
  isLoadingAccounts: boolean;
  isLoadingRestaurants: boolean;
  setSelectedAccount: (account: IfoodAccount | null) => void;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  setAccounts: (accounts: IfoodAccount[]) => void;
  setRestaurants: (restaurants: Restaurant[]) => void;
  loadAccounts: () => Promise<void>;
  loadRestaurants: (ifoodAccountId?: string) => Promise<void>;
  reset: () => void;
}

export const useRestaurantStore = create<RestaurantState>((set, get) => ({
  selectedAccount: null,
  selectedRestaurant: null,
  accounts: [],
  restaurants: [],
  isLoadingAccounts: false,
  isLoadingRestaurants: false,
  setSelectedAccount: (selectedAccount) => set({ selectedAccount, selectedRestaurant: null }),
  setSelectedRestaurant: (selectedRestaurant) => set({ selectedRestaurant }),
  setAccounts: (accounts) => set({ accounts }),
  setRestaurants: (restaurants) => set({ restaurants }),

  loadAccounts: async () => {
    set({ isLoadingAccounts: true });
    try {
      const accounts = await ifoodAccountRepository.getAll({ isActive: true });
      set({ accounts });

      // Auto-select first account if none selected
      if (!get().selectedAccount && accounts.length > 0) {
        set({ selectedAccount: accounts[0] });
      }
    } finally {
      set({ isLoadingAccounts: false });
    }
  },

  loadRestaurants: async (ifoodAccountId?: string) => {
    set({ isLoadingRestaurants: true });
    try {
      const accountId = ifoodAccountId ?? get().selectedAccount?.id;
      const restaurants = await restaurantRepository.getAll(
        accountId ? { ifoodAccountId: accountId, isActive: true } : { isActive: true },
      );
      set({ restaurants });

      // Auto-select first restaurant if none selected
      if (!get().selectedRestaurant && restaurants.length > 0) {
        set({ selectedRestaurant: restaurants[0] });
      }
    } finally {
      set({ isLoadingRestaurants: false });
    }
  },

  reset: () =>
    set({
      selectedAccount: null,
      selectedRestaurant: null,
      accounts: [],
      restaurants: [],
      isLoadingAccounts: false,
      isLoadingRestaurants: false,
    }),
}));
