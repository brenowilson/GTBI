import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { useAuthStore } from "@/stores/auth.store";
import { useRestaurantStore } from "@/stores/restaurant.store";
import type { LoginInput, ForgotPasswordInput } from "../types";
import type { UserRole } from "@/entities/user";

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading, setUser, setRoles, setLoading, reset } = useAuthStore();
  const { reset: resetRestaurant } = useRestaurantStore();

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profile) {
        setUser(profile);
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("roles(*)")
        .eq("user_id", userId);

      if (roles) {
        const parsedRoles = roles
          .map((r: Record<string, unknown>) => r.roles)
          .filter(Boolean) as UserRole[];
        setRoles(parsedRoles);
      }

      // Prefetch permissions so they are ready when ProtectedRoute checks them
      await queryClient.prefetchQuery({
        queryKey: ["permissions", userId],
        queryFn: async () => {
          const { data } = await supabase.rpc("get_user_permissions", {
            p_user_id: userId,
          });
          return data ?? [];
        },
      });
    } finally {
      setLoading(false);
    }
  }, [setUser, setRoles, setLoading, queryClient]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        loadUserProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        reset();
        resetRestaurant();
        queryClient.clear();
        navigate("/login");
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Session refreshed — no need to reload full profile
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error) throw error;
    },
    onSuccess: () => navigate("/performance"),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (input: ForgotPasswordInput) => {
      const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => navigate("/login"),
  });

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    reset();
    resetRestaurant();
    queryClient.clear();
    navigate("/login");
  }, [navigate, reset, resetRestaurant, queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation,
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
    logout,
  };
}
