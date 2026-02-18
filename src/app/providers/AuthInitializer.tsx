import { useEffect, type ReactNode } from "react";
import { supabase } from "@/shared/lib/supabase";
import { useAuthStore } from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "./ThemeProvider";
import type { UserRole } from "@/entities/user";

/**
 * Initializes the Supabase auth listener at the app level.
 * This ensures setLoading(false) is called regardless of which
 * page the user lands on (fixes infinite loading on direct navigation).
 */
export function AuthInitializer({ children }: { children: ReactNode }) {
  const { setUser, setRoles, setLoading, reset } = useAuthStore();
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();

  useEffect(() => {
    async function loadUserProfile(userId: string) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError) {
          console.error("[Auth] Failed to load user profile:", profileError.message);
        }

        if (profile) {
          setUser(profile);

          if (profile.theme_preference) {
            setTheme(profile.theme_preference);
          }
        }

        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("roles(*)")
          .eq("user_id", userId);

        if (rolesError) {
          console.error("[Auth] Failed to load user roles:", rolesError.message);
        }

        if (roles) {
          const parsedRoles = roles
            .map((r: Record<string, unknown>) => r.roles)
            .filter(Boolean) as UserRole[];
          setRoles(parsedRoles);
        }

        await queryClient.prefetchQuery({
          queryKey: ["permissions", userId],
          queryFn: async () => {
            const { data, error } = await supabase.rpc("get_user_permissions", {
              p_user_id: userId,
            });
            if (error) {
              console.error("[Auth] Failed to load permissions:", error.message);
            }
            return data ?? [];
          },
        });
      } catch (err) {
        console.error("[Auth] Unexpected error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        console.warn("[Auth] No active session found");
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        loadUserProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        reset();
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
