import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboard } from "../components/AdminDashboard";
import { UserTable } from "../components/UserTable";
import { EditUserDialog } from "../components/EditUserDialog";
import { InviteUserForm } from "../components/InviteUserForm";
import { RoleMatrix } from "../components/RoleMatrix";
import { IfoodAccountCard } from "../components/IfoodAccountCard";
import { ConnectIfoodAccountForm } from "../components/ConnectIfoodAccountForm";
import { AuditLogTable } from "../components/AuditLogTable";
import { NotificationComposer } from "../components/NotificationComposer";
import { WhatsAppPanel } from "../components/WhatsAppPanel";
import {
  useAdminStats,
  useUsers,
  useUserRoles,
  useUserRoleAssignments,
  useInviteUser,
  useUpdateUserRole,
  useDeactivateUser,
  useReactivateUser,
  useAuditLogs,
  useSendNotification,
  useIfoodAccounts,
  useConnectIfoodAccount,
  useSyncIfoodRestaurants,
  useDeactivateIfoodAccount,
} from "../hooks";
import type { SendNotificationInput } from "@/shared/repositories/interfaces";

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "dashboard";
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  function handleTabChange(value: string) {
    setSearchParams({ tab: value }, { replace: true });
  }
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: roles, isLoading: rolesLoading } = useUserRoles();
  const { data: roleAssignments } = useUserRoleAssignments();
  const { data: auditLogs, isLoading: logsLoading } = useAuditLogs();
  const { data: accounts, isLoading: accountsLoading } = useIfoodAccounts();

  const inviteUser = useInviteUser();
  const updateUserRole = useUpdateUserRole();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const sendNotification = useSendNotification();
  const connectIfoodAccount = useConnectIfoodAccount();
  const syncRestaurants = useSyncIfoodRestaurants();
  const deactivateAccount = useDeactivateIfoodAccount();

  // Build a map from userId -> roleId for fast lookup
  const userRoleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const assignment of roleAssignments ?? []) {
      map.set(assignment.user_id, assignment.role_id);
    }
    return map;
  }, [roleAssignments]);

  // Build a map from roleId -> roleName for display
  const roleNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const role of roles ?? []) {
      map.set(role.id, role.name);
    }
    return map;
  }, [roles]);

  function handleInvite(data: { email: string; fullName: string; roleId: string }) {
    inviteUser.mutate({
      email: data.email,
      full_name: data.fullName,
      role_id: data.roleId,
    });
  }

  function handleToggleUserStatus(userId: string) {
    const user = users?.find((u) => u.id === userId);
    if (!user) return;
    if (user.is_active) {
      deactivateUser.mutate(userId);
    } else {
      reactivateUser.mutate(userId);
    }
  }

  function handleEditUserSave(data: {
    userId: string;
    roleId: string | null;
    isActive: boolean;
    previousRoleId: string | null;
  }) {
    const user = users?.find((u) => u.id === data.userId);
    if (!user) return;

    // Handle active status change
    if (data.isActive !== user.is_active) {
      if (data.isActive) {
        reactivateUser.mutate(data.userId);
      } else {
        deactivateUser.mutate(data.userId);
      }
    }

    // Handle role change
    const roleChanged = data.roleId !== data.previousRoleId;
    if (roleChanged) {
      // Remove old role if one existed
      if (data.previousRoleId) {
        updateUserRole.mutate({
          userId: data.userId,
          roleId: data.previousRoleId,
          action: "remove",
        });
      }
      // Assign new role if one was selected
      if (data.roleId) {
        updateUserRole.mutate({
          userId: data.userId,
          roleId: data.roleId,
          action: "assign",
        });
      }
    }

    setEditingUserId(null);
  }

  function handleSendNotification(data: {
    title: string;
    body: string;
    channels: ("email" | "whatsapp")[];
    recipientIds: string[];
  }) {
    // Send a notification for each recipient and each channel.
    // For WhatsApp, the Edge Function should enforce a 15-second delay
    // between messages to comply with rate limits.
    for (const recipientId of data.recipientIds) {
      for (const channel of data.channels) {
        const input: SendNotificationInput = {
          title: data.title,
          body: data.body,
          channel,
          recipientUserId: recipientId,
        };
        sendNotification.mutate(input);
      }
    }
  }

  function handleSyncAccount(accountId: string) {
    syncRestaurants.mutate(accountId);
  }

  function handleDisconnectAccount(accountId: string) {
    deactivateAccount.mutate(accountId);
  }

  // Map users from API (snake_case) to UserTable component (camelCase)
  const mappedUsers = (users ?? []).map((u) => {
    const roleId = userRoleMap.get(u.id);
    const roleName = roleId ? roleNameMap.get(roleId) : undefined;
    return {
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      role: roleName ?? "—",
      isActive: u.is_active,
    };
  });

  // Build editing user data for the dialog
  const editingUser = useMemo(() => {
    if (!editingUserId) return null;
    const user = users?.find((u) => u.id === editingUserId);
    if (!user) return null;
    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      isActive: user.is_active,
      roleId: userRoleMap.get(user.id) ?? null,
    };
  }, [editingUserId, users, userRoleMap]);

  // Derive notification user list from users data
  const notificationUsers = (users ?? []).map((u) => ({
    id: u.id,
    name: u.full_name,
  }));

  // Build role options for InviteUserForm
  const roleOptions = (roles ?? []).map((r) => ({
    id: r.id,
    name: r.name,
  }));

  // Map admin stats from API shape to component shape
  const mappedStats = stats
    ? {
        totalUsers: stats.totalUsers,
        totalAccounts: stats.activeRestaurants,
        totalRestaurants: stats.totalRestaurants,
        totalReports: stats.totalReports,
      }
    : null;

  // Map audit logs from API (snake_case) to component (camelCase)
  const mappedLogs = (auditLogs ?? []).map((log) => ({
    id: log.id,
    user: log.user_id ?? "Sistema",
    action: log.action,
    entity: log.entity,
    timestamp: log.created_at,
  }));

  const isInitialLoading = usersLoading && rolesLoading;

  if (isInitialLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
        <p className="text-muted-foreground">
          Gerencie usuários, permissões, contas e logs do sistema.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="accounts">Contas iFood</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : statsError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-muted-foreground">
                Estatísticas indisponíveis no momento.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetchStats()}>
                Tentar novamente
              </Button>
            </div>
          ) : mappedStats ? (
            <AdminDashboard stats={mappedStats} />
          ) : null}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <InviteUserForm roles={roleOptions} onInvite={handleInvite} />
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <UserTable
              users={mappedUsers}
              onEdit={setEditingUserId}
              onToggleStatus={handleToggleUserStatus}
            />
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <RoleMatrix />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <ConnectIfoodAccountForm
            onConnect={(data) => connectIfoodAccount.mutate(data)}
            isLoading={connectIfoodAccount.isPending}
          />
          {accountsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (accounts ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <p>Nenhuma conta iFood conectada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(accounts ?? []).map((account) => (
                <IfoodAccountCard
                  key={account.id}
                  account={account}
                  onSync={handleSyncAccount}
                  onDisconnect={handleDisconnectAccount}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <WhatsAppPanel />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <AuditLogTable logs={mappedLogs} />
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationComposer
            users={notificationUsers}
            clients={[]}
            onSend={handleSendNotification}
          />
        </TabsContent>
      </Tabs>

      <EditUserDialog
        open={editingUserId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingUserId(null);
        }}
        user={editingUser}
        roles={roleOptions}
        onSave={handleEditUserSave}
        isSaving={updateUserRole.isPending || deactivateUser.isPending || reactivateUser.isPending}
      />

    </div>
  );
}
