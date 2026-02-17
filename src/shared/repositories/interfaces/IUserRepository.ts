import type { UserProfile, UserWithRole, UserRole, CreateUserInput } from "@/entities/user";

export interface UserFilters {
  isActive?: boolean;
  roleId?: string;
  search?: string;
}

export interface IUserRepository {
  getAll(filters?: UserFilters): Promise<UserProfile[]>;
  getById(id: string): Promise<UserProfile | null>;
  getWithRole(id: string): Promise<UserWithRole | null>;
  update(id: string, data: Partial<Pick<UserProfile, "full_name" | "avatar_url" | "theme_preference">>): Promise<UserProfile>;
  deactivate(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
  getRoles(): Promise<UserRole[]>;
  assignRole(userId: string, roleId: string): Promise<void>;
  removeRole(userId: string, roleId: string): Promise<void>;
  invite(data: CreateUserInput): Promise<void>;
  acceptInvite(token: string): Promise<void>;
}
