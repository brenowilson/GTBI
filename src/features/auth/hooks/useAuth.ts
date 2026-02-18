import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { useAuthStore } from "@/stores/auth.store";
import { useRestaurantStore } from "@/stores/restaurant.store";
import type { LoginInput, ForgotPasswordInput } from "../types";

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading, reset } = useAuthStore();
  const { reset: resetRestaurant } = useRestaurantStore();

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
