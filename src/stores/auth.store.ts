import { create } from "zustand";
import type { UserProfile, UserRole } from "@/entities/user";

interface AuthState {
  user: UserProfile | null;
  roles: UserRole[];
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setRoles: (roles: UserRole[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  roles: [],
  isLoading: true,
  setUser: (user) => set({ user }),
  setRoles: (roles) => set({ roles }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, roles: [], isLoading: false }),
}));
