import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboard } from "../components/AdminDashboard";
import { UserTable } from "../components/UserTable";
import { InviteUserForm } from "../components/InviteUserForm";
import { RoleMatrix } from "../components/RoleMatrix";
import { IfoodAccountCard } from "../components/IfoodAccountCard";
import { AuditLogTable } from "../components/AuditLogTable";
import { NotificationComposer } from "../components/NotificationComposer";
import type { IfoodAccount } from "@/entities/ifood-account/model";

const mockStats = {
  totalUsers: 24,
  totalAccounts: 5,
  totalRestaurants: 12,
  totalReports: 156,
};

const mockUsers = [
  { id: "u1", fullName: "Maria Silva", email: "maria@empresa.com", role: "Admin", isActive: true },
  { id: "u2", fullName: "João Santos", email: "joao@empresa.com", role: "Gerente", isActive: true },
  { id: "u3", fullName: "Ana Costa", email: "ana@empresa.com", role: "Operador", isActive: false },
  { id: "u4", fullName: "Carlos Lima", email: "carlos@empresa.com", role: "Visualizador", isActive: true },
];

const mockRoles = [
  { id: "role-1", name: "Admin" },
  { id: "role-2", name: "Gerente" },
  { id: "role-3", name: "Operador" },
  { id: "role-4", name: "Visualizador" },
];

const mockFeatures = [
  { id: "feat-1", name: "Relatórios" },
  { id: "feat-2", name: "Avaliações" },
  { id: "feat-3", name: "Chamados" },
  { id: "feat-4", name: "Financeiro" },
  { id: "feat-5", name: "Catálogo" },
];

const mockPermissions = [
  { roleId: "role-1", featureId: "feat-1", create: true, read: true, update: true, delete: true },
  { roleId: "role-1", featureId: "feat-2", create: true, read: true, update: true, delete: true },
  { roleId: "role-1", featureId: "feat-3", create: true, read: true, update: true, delete: true },
  { roleId: "role-1", featureId: "feat-4", create: true, read: true, update: true, delete: true },
  { roleId: "role-1", featureId: "feat-5", create: true, read: true, update: true, delete: true },
  { roleId: "role-2", featureId: "feat-1", create: true, read: true, update: true, delete: false },
  { roleId: "role-2", featureId: "feat-2", create: true, read: true, update: true, delete: false },
  { roleId: "role-2", featureId: "feat-3", create: true, read: true, update: true, delete: false },
  { roleId: "role-2", featureId: "feat-4", create: false, read: true, update: false, delete: false },
  { roleId: "role-2", featureId: "feat-5", create: true, read: true, update: true, delete: false },
  { roleId: "role-3", featureId: "feat-1", create: false, read: true, update: true, delete: false },
  { roleId: "role-3", featureId: "feat-2", create: false, read: true, update: true, delete: false },
  { roleId: "role-3", featureId: "feat-3", create: false, read: true, update: true, delete: false },
  { roleId: "role-3", featureId: "feat-4", create: false, read: true, update: false, delete: false },
  { roleId: "role-3", featureId: "feat-5", create: false, read: true, update: false, delete: false },
  { roleId: "role-4", featureId: "feat-1", create: false, read: true, update: false, delete: false },
  { roleId: "role-4", featureId: "feat-2", create: false, read: true, update: false, delete: false },
  { roleId: "role-4", featureId: "feat-3", create: false, read: true, update: false, delete: false },
  { roleId: "role-4", featureId: "feat-4", create: false, read: true, update: false, delete: false },
  { roleId: "role-4", featureId: "feat-5", create: false, read: true, update: false, delete: false },
];

const mockAccounts: IfoodAccount[] = [
  {
    id: "acc-1",
    name: "Conta Principal",
    merchant_id: "MERCH-001",
    is_active: true,
    token_expires_at: "2026-03-15T00:00:00Z",
    last_sync_at: "2026-02-17T08:00:00Z",
    created_at: "2025-06-01T10:00:00Z",
    updated_at: "2026-02-17T08:00:00Z",
  },
  {
    id: "acc-2",
    name: "Conta Secundária",
    merchant_id: "MERCH-002",
    is_active: true,
    token_expires_at: "2026-02-10T00:00:00Z",
    last_sync_at: "2026-02-09T12:00:00Z",
    created_at: "2025-08-15T10:00:00Z",
    updated_at: "2026-02-09T12:00:00Z",
  },
];

const mockLogs = [
  { id: "log-1", user: "Maria Silva", action: "Criar", entity: "Relatório #45", timestamp: "2026-02-17T10:30:00Z" },
  { id: "log-2", user: "João Santos", action: "Editar", entity: "Restaurante Central", timestamp: "2026-02-17T09:15:00Z" },
  { id: "log-3", user: "Maria Silva", action: "Enviar", entity: "Relatório #44", timestamp: "2026-02-16T16:00:00Z" },
  { id: "log-4", user: "Ana Costa", action: "Criar", entity: "Ação: Promoção", timestamp: "2026-02-16T14:00:00Z" },
  { id: "log-5", user: "Carlos Lima", action: "Visualizar", entity: "Financeiro", timestamp: "2026-02-16T11:00:00Z" },
];

const mockNotificationUsers = [
  { id: "u1", name: "Maria Silva" },
  { id: "u2", name: "João Santos" },
  { id: "u3", name: "Ana Costa" },
  { id: "u4", name: "Carlos Lima" },
];

export function AdminPage() {
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
          <AdminDashboard stats={mockStats} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <InviteUserForm roles={mockRoles} onInvite={() => {}} />
          <UserTable users={mockUsers} />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <RoleMatrix
            roles={mockRoles}
            features={mockFeatures}
            permissions={mockPermissions}
          />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mockAccounts.map((account) => (
              <IfoodAccountCard key={account.id} account={account} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <AuditLogTable logs={mockLogs} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationComposer
            users={mockNotificationUsers}
            onSend={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
