import { supabase } from "@/shared/lib/supabase";
import { invokeFunction } from "@/shared/lib/api";
import type { IUserRepository, UserFilters, UserRoleAssignment } from "../interfaces/IUserRepository";
import type { UserProfile, UserWithRole, UserRole, CreateUserInput } from "@/entities/user";

export class SupabaseUserRepository implements IUserRepository {
  async getAll(filters?: UserFilters): Promise<UserProfile[]> {
    let query = supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }

    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    if (filters?.roleId && data) {
      const { data: userRoles, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role_id", filters.roleId);

      if (roleError) throw new Error(roleError.message);

      const userIdsWithRole = new Set(userRoles?.map((ur) => ur.user_id));
      return data.filter((user) => userIdsWithRole.has(user.id));
    }

    return data ?? [];
  }

  async getById(id: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async getWithRole(id: string): Promise<UserWithRole | null> {
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (profileError) throw new Error(profileError.message);
    if (!profile) return null;

    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", id);

    if (rolesError) throw new Error(rolesError.message);

    const roleIds = userRoles?.map((ur) => ur.role_id) ?? [];

    let roles: UserRole[] = [];
    if (roleIds.length > 0) {
      const { data: rolesData, error: rolesDataError } = await supabase
        .from("roles")
        .select("*")
        .in("id", roleIds);

      if (rolesDataError) throw new Error(rolesDataError.message);
      roles = rolesData ?? [];
    }

    return { ...profile, roles };
  }

  async update(
    id: string,
    data: Partial<Pick<UserProfile, "full_name" | "avatar_url" | "theme_preference">>,
  ): Promise<UserProfile> {
    const { data: updated, error } = await supabase
      .from("user_profiles")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async reactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_active: true })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async getRoles(): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getRoleAssignments(): Promise<UserRoleAssignment[]> {
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id, role_id");

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role_id: roleId });

    if (error) throw new Error(error.message);
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role_id", roleId);

    if (error) throw new Error(error.message);
  }

  async invite(data: CreateUserInput): Promise<void> {
    const { error } = await invokeFunction("auth-invite", {
      email: data.email,
      full_name: data.full_name,
      role_id: data.role_id,
    });

    if (error) throw new Error(error);
  }

  async acceptInvite(token: string): Promise<void> {
    const { error } = await invokeFunction("auth-accept-invite", { token });
    if (error) throw new Error(error);
  }
}
