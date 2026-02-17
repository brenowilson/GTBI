import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { useAuthStore } from "@/stores/auth.store";
import type { LoginInput, ForgotPasswordInput } from "../types";

export function useAuth() {
  const navigate = useNavigate();
  const { user, isLoading, setUser, setRoles, setLoading, reset } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserProfile = useCallback(async (userId: string) => {
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
      setRoles(roles.map((r: Record<string, unknown>) => r.roles).filter(Boolean) as never[]);
    }

    setLoading(false);
  }, [setUser, setRoles, setLoading]);

  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error) throw error;
    },
    onSuccess: () => navigate("/"),
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
    navigate("/login");
  }, [navigate, reset]);

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
