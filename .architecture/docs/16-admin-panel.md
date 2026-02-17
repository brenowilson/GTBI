# Admin Panel - Padroes e Especificacoes

Este documento define os padroes para geracao do Admin Panel em projetos do framework.

---

## Visao Geral

O Admin Panel e **adaptavel ao contexto do projeto**. NAO e um modelo fixo - deve ser gerado com base no PRD:

- Se o projeto tem "Tasks", gerar CRUD de tasks
- Se o projeto tem "Orders", gerar CRUD de orders
- Se o projeto tem pagamentos, gerar visualizacao de assinaturas
- Se o projeto NAO tem organizacoes, NAO gerar gestao de organizacoes

---

## Estrutura de Pastas

```
src/features/admin/
├── components/
│   ├── AdminLayout.tsx           # Layout com sidebar
│   ├── AdminSidebar.tsx          # Navegacao dinamica
│   ├── AdminHeader.tsx           # Header com user info
│   ├── StatsCard.tsx             # Card de metrica
│   ├── DataTable.tsx             # Tabela generica com paginacao
│   ├── EntityDetails.tsx         # Detalhes de entidade (generico)
│   ├── AuditLogViewer.tsx        # Visualizador de logs
│   ├── AdminRoleManager.tsx      # Gestao de roles do admin
│   ├── PromotionalBarEditor.tsx  # Editor de barras promocionais
│   ├── NotificationWizard.tsx    # Wizard de notificacoes
│   └── AIAssistantConfig.tsx     # Config do assistente IA
├── pages/
│   ├── AdminDashboard.tsx        # Overview com metricas
│   ├── AdminUsers.tsx            # Gestao de usuarios (sempre presente)
│   ├── AdminAuditLogs.tsx        # Audit logs
│   ├── AdminRoles.tsx            # Roles do admin panel
│   ├── Admin[Entity].tsx         # CRUD por entidade (dinamico)
│   ├── AdminSubscriptions.tsx    # Se houver pagamentos
│   ├── AdminPromotionalBars.tsx  # Barras promocionais
│   └── AdminNotifications.tsx    # Criacao de notificacoes
├── hooks/
│   ├── useAdminStats.ts          # Metricas
│   ├── useAdminUsers.ts          # CRUD usuarios
│   ├── useAdminEntity.ts         # CRUD generico de entidade
│   ├── useAuditLogs.ts           # Query audit logs
│   ├── useAdminRoles.ts          # Gestao de roles
│   ├── useAdminPermissions.ts    # Verificar permissoes
│   └── useImpersonation.ts       # Login como usuario
├── types.ts
└── index.ts
```

---

## Padroes de Componentes

### AdminLayout

- Sidebar fixo a esquerda (240-256px)
- Header no topo do content area
- Main content com padding e scroll
- Verificacao de permissao na entrada

```tsx
// src/features/admin/components/AdminLayout.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUserPermissions } from '@/features/roles/hooks/useUserPermissions';

export function AdminLayout() {
  const { user, isLoading } = useAuth();
  const { hasFeature } = useUserPermissions();

  if (isLoading) return <LoadingSpinner />;

  // Verifica se usuario tem a feature "Admin Panel" ativada
  const canAccessAdmin = hasFeature('admin_panel');

  if (!canAccessAdmin) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### DataTable

- Colunas definidas por config
- Paginacao no footer
- Acoes por linha (dropdown menu)
- Loading state com skeleton

```tsx
// src/features/admin/components/DataTable.tsx
interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  pagination,
}: DataTableProps<T>) {
  // Implementacao com shadcn/ui Table
}
```

### StatsCard

- Icone + titulo + valor
- Variante com trend (seta up/down)
- Grid de 4 colunas no dashboard

```tsx
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}
```

---

## Sistema de Roles do Admin

O Admin Panel tem seu proprio sistema de roles, separado das roles do projeto principal.

### Schema SQL

```sql
-- Roles especificas do Admin Panel
CREATE TABLE public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,        -- 'super_admin', 'support', 'viewer'
  description TEXT,
  permissions JSONB NOT NULL,       -- Permissoes dentro do admin
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Associacao usuario <-> admin role
CREATE TABLE public.user_admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_role_id UUID REFERENCES admin_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Roles padrao
INSERT INTO admin_roles (name, description, permissions) VALUES
  ('super_admin', 'Acesso total ao admin', '{"all": true}'),
  ('support', 'Suporte ao cliente', '{"users": ["view", "impersonate"], "audit_logs": ["view"]}'),
  ('viewer', 'Apenas visualizacao', '{"users": ["view"], "audit_logs": ["view"]}');
```

### Hook de Permissoes

```typescript
// src/features/admin/hooks/useAdminPermissions.ts
interface AdminPermissions {
  all?: boolean;
  users?: ('view' | 'edit' | 'delete' | 'impersonate')[];
  audit_logs?: ('view' | 'export')[];
  entities?: Record<string, ('view' | 'edit' | 'delete')[]>;
  subscriptions?: ('view' | 'refund')[];
  roles?: ('view' | 'edit')[];
}

export function useAdminPermissions() {
  const { data: permissions } = useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_admin_roles')
        .select('admin_roles(permissions)')
        .single();

      return data?.admin_roles?.permissions as AdminPermissions;
    },
  });

  const can = (resource: string, action: string): boolean => {
    if (!permissions) return false;
    if (permissions.all) return true;

    const resourcePerms = permissions[resource as keyof AdminPermissions];
    if (!resourcePerms) return false;
    if (Array.isArray(resourcePerms)) {
      return resourcePerms.includes(action as never);
    }
    return false;
  };

  return { permissions, can };
}
```

---

## Funcionalidades do Admin

### Dashboard Adaptavel

O dashboard deve mostrar metricas relevantes ao projeto:

```tsx
export function AdminDashboard() {
  const { data: stats } = useAdminStats();

  // Metricas base (sempre presentes)
  const baseMetrics = [
    { title: 'Total Usuarios', value: stats?.totalUsers, icon: Users },
    { title: 'Usuarios Ativos (7d)', value: stats?.activeUsers7d, icon: Activity },
  ];

  // Metricas condicionais (baseadas no PRD)
  const conditionalMetrics = [];

  // Se tem pagamentos
  if (stats?.mrr !== undefined) {
    conditionalMetrics.push({
      title: 'MRR',
      value: formatCurrency(stats.mrr),
      icon: CreditCard,
    });
  }

  // Se tem entidade especifica (ex: Tasks)
  if (stats?.totalTasks !== undefined) {
    conditionalMetrics.push({
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: CheckSquare,
    });
  }

  const metrics = [...baseMetrics, ...conditionalMetrics];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <StatsCard key={metric.title} {...metric} />
      ))}
    </div>
  );
}
```

### CRUDs por Entidade

Para cada entidade do PRD, gerar pagina de CRUD com:
- Listagem com paginacao
- Filtros
- Acoes por linha (ver, editar, deletar)
- Modal/pagina de detalhes

### Assinaturas (Se Houver Pagamentos)

Gerar APENAS se o PRD especificar gateway de pagamento:
- Lista de assinaturas ativas
- Detalhes da assinatura
- Historico de pagamentos

---

## RLS Policies

Ver `.architecture/docs/04-seguranca.md` secao "Admin Roles" para policies completas.

---

## Referencias

| Documento | Conteudo |
|-----------|----------|
| `docs/04-seguranca.md` | RBAC, Audit Logging, RLS |
| `docs/20-promotional-bars.md` | Barras promocionais do admin |
| `agents/admin-panel-agent.md` | Instrucoes de execucao |
