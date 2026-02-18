import type { UserProfile, UserWithRole, UserRole, CreateUserInput } from "@/entities/user";

export interface UserFilters {
  isActive?: boolean;
  roleId?: string;
  search?: string;
}

export interface UserRoleAssignment {
  user_id: string;
  role_id: string;
}

export interface RolePermissionEntry {
  role_id: string;
  feature_code: string;
  action: string;
}

export interface FeatureDefinition {
  code: string;
  name: string;
}

export interface IUserRepository {
  getAll(filters?: UserFilters): Promise<UserProfile[]>;
  getById(id: string): Promise<UserProfile | null>;
  getWithRole(id: string): Promise<UserWithRole | null>;
  update(id: string, data: Partial<Pick<UserProfile, "full_name" | "avatar_url" | "theme_preference">>): Promise<UserProfile>;
  deactivate(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
  getRoles(): Promise<UserRole[]>;
  getRoleAssignments(): Promise<UserRoleAssignment[]>;
  assignRole(userId: string, roleId: string): Promise<void>;
  removeRole(userId: string, roleId: string): Promise<void>;
  invite(data: CreateUserInput): Promise<void>;
  acceptInvite(token: string): Promise<void>;
  createRole(name: string, description: string): Promise<UserRole>;
  deleteRole(roleId: string): Promise<void>;
  getRolePermissions(): Promise<RolePermissionEntry[]>;
  getFeatures(): Promise<FeatureDefinition[]>;
  grantPermission(roleId: string, featureCode: string, action: string): Promise<void>;
  revokePermission(roleId: string, featureCode: string, action: string): Promise<void>;
}
