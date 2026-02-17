import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { useAuthStore } from "@/stores/auth.store";
import type { Permission } from "../types";

export function useUserPermissions() {
  const { user, roles } = useAuthStore();

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ["permissions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.rpc("get_user_permissions", {
        p_user_id: user.id,
      });
      return (data as Permission[]) ?? [];
    },
    enabled: !!user,
  });

  const can = useCallback(
    (featureCode: string, action: string): boolean => {
      const isAdmin = roles.some((r) => r.is_system && r.name === "admin");
      if (isAdmin) return true;
      return permissions.some(
        (p) => p.feature_code === featureCode && p.action === action
      );
    },
    [permissions, roles]
  );

  const isAdmin = roles.some((r) => r.is_system && r.name === "admin");

  return { permissions, can, isAdmin };
}
