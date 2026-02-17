import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboard } from "../components/AdminDashboard";
import { UserTable } from "../components/UserTable";
import { InviteUserForm } from "../components/InviteUserForm";
import { RoleMatrix } from "../components/RoleMatrix";
import { IfoodAccountCard } from "../components/IfoodAccountCard";
import { AuditLogTable } from "../components/AuditLogTable";
import { NotificationComposer } from "../components/NotificationComposer";
import {
  useAdminStats,
  useUsers,
  useUserRoles,
  useInviteUser,
  useDeactivateUser,
  useReactivateUser,
  useAuditLogs,
  useSendNotification,
  useIfoodAccounts,
  useSyncIfoodRestaurants,
  useDeactivateIfoodAccount,
} from "../hooks";
import type { SendNotificationInput } from "@/shared/repositories/interfaces";

export function AdminPage() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: roles, isLoading: rolesLoading } = useUserRoles();
  const { data: auditLogs, isLoading: logsLoading } = useAuditLogs();
  const { data: accounts, isLoading: accountsLoading } = useIfoodAccounts();

  const inviteUser = useInviteUser();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const sendNotification = useSendNotification();
  const syncRestaurants = useSyncIfoodRestaurants();
  const deactivateAccount = useDeactivateIfoodAccount();

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

  function handleSendNotification(data: {
    title: string;
    body: string;
    channel: "email" | "whatsapp";
    recipientIds: string[];
  }) {
    const input: SendNotificationInput = {
      title: data.title,
      body: data.body,
      channel: data.channel,
      recipientUserId: data.recipientIds[0],
    };
    sendNotification.mutate(input);
  }

  function handleSyncAccount(accountId: string) {
    syncRestaurants.mutate(accountId);
  }

  function handleDisconnectAccount(accountId: string) {
    deactivateAccount.mutate(accountId);
  }

  // Map users from API (snake_case) to UserTable component (camelCase)
  const mappedUsers = (users ?? []).map((u) => ({
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    role: "—",
    isActive: u.is_active,
  }));

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

  // Build features/permissions for RoleMatrix
  const features = [
    { id: "feat-1", name: "Relatórios" },
    { id: "feat-2", name: "Avaliações" },
    { id: "feat-3", name: "Chamados" },
    { id: "feat-4", name: "Financeiro" },
    { id: "feat-5", name: "Catálogo" },
  ];

  const isInitialLoading = statsLoading && usersLoading && rolesLoading;

  if (isInitialLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Erro ao carregar dados de administração.</p>
        <Button variant="outline" onClick={() => refetchStats()}>
          Tentar novamente
        </Button>
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

      <Tabs defaultValue="dashboard">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="accounts">Contas iFood</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
              onToggleStatus={handleToggleUserStatus}
            />
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          {rolesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <RoleMatrix
              roles={roleOptions}
              features={features}
              permissions={[]}
            />
          )}
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
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
            onSend={handleSendNotification}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
