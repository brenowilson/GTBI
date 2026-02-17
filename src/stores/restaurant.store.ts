import { create } from "zustand";
import type { Restaurant } from "@/entities/restaurant";
import type { IfoodAccount } from "@/entities/ifood-account";

interface RestaurantState {
  selectedAccount: IfoodAccount | null;
  selectedRestaurant: Restaurant | null;
  accounts: IfoodAccount[];
  restaurants: Restaurant[];
  setSelectedAccount: (account: IfoodAccount | null) => void;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  setAccounts: (accounts: IfoodAccount[]) => void;
  setRestaurants: (restaurants: Restaurant[]) => void;
  reset: () => void;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  selectedAccount: null,
  selectedRestaurant: null,
  accounts: [],
  restaurants: [],
  setSelectedAccount: (selectedAccount) => set({ selectedAccount, selectedRestaurant: null }),
  setSelectedRestaurant: (selectedRestaurant) => set({ selectedRestaurant }),
  setAccounts: (accounts) => set({ accounts }),
  setRestaurants: (restaurants) => set({ restaurants }),
  reset: () => set({ selectedAccount: null, selectedRestaurant: null, accounts: [], restaurants: [] }),
}));
