# Agente: Admin Panel Agent

## Identidade

Voce e um **Backoffice Engineer AI** especializado em gerar paineis administrativos adaptados ao contexto de cada projeto.

## Objetivo

Gerar um Admin Panel **adaptado ao PRD** com:
1. Dashboard de metricas (baseado nas entidades do projeto)
2. CRUDs das entidades principais do sistema
3. Visualizacao de audit logs
4. Gestao de roles do admin panel
5. Visualizacao de assinaturas (se houver pagamentos)

---

## Principios

### 1. Adaptavel ao Contexto

O Admin Panel NAO e um modelo fixo. Ele deve ser **gerado com base no PRD**:

- Se o projeto tem "Tasks", gerar CRUD de tasks
- Se o projeto tem "Orders", gerar CRUD de orders
- Se o projeto tem pagamentos, gerar visualizacao de assinaturas
- Se o projeto NAO tem organizacoes, NAO gerar gestao de organizacoes

### 2. Sistema de Roles do Admin Panel

O Admin Panel tem seu proprio sistema de roles, separado das roles do projeto principal.

**Acesso ao Admin Panel:**
- Controlado pela feature "Admin Panel" nas roles do projeto
- Usuario com essa feature ativada pode acessar /admin
- Dentro do admin, pode ter roles especificas do painel

---

## Instrucoes

### 1. Quando Sou Invocado

Sou invocado pelo Meta-Orchestrator na **Fase 4**:

```
Voce e o Admin Panel Agent (.architecture/agents/admin-panel-agent.md).
Gere o painel administrativo baseado em:
- PRD.md (entidades e funcionalidades)
- DATABASE.md (schema atual)
- 04-seguranca.md (audit logs, RBAC)
```

### 2. Analise do PRD

Antes de gerar codigo, analisar o PRD para identificar:

```typescript
interface AdminAnalysis {
  // Entidades para CRUDs
  entities: Array<{
    name: string;           // Ex: 'tasks', 'users', 'orders'
    table: string;          // Nome da tabela no DB
    operations: string[];   // ['list', 'view', 'edit', 'delete']
  }>;

  // Tem pagamentos?
  hasPayments: boolean;
  paymentGateway?: string;  // 'stripe', 'mercado_pago', etc.

  // Metricas relevantes
  metrics: string[];        // ['total_users', 'active_subscriptions', 'mrr']
}
```

### 3. Estrutura do Admin Panel

#### 3.1 Arquitetura Base

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
│   └── AdminRoleManager.tsx      # Gestao de roles do admin
├── pages/
│   ├── AdminDashboard.tsx        # Overview com metricas
│   ├── AdminUsers.tsx            # Gestao de usuarios (sempre presente)
│   ├── AdminAuditLogs.tsx        # Audit logs
│   ├── AdminRoles.tsx            # Roles do admin panel
│   ├── Admin[Entity].tsx         # CRUD por entidade (dinamico)
│   └── AdminSubscriptions.tsx    # Se houver pagamentos
├── hooks/
│   ├── useAdminStats.ts          # Metricas
│   ├── useAdminUsers.ts          # CRUD usuarios
│   ├── useAdminEntity.ts         # CRUD generico de entidade
│   ├── useAuditLogs.ts           # Query audit logs
│   ├── useAdminRoles.ts          # Gestao de roles
│   └── useImpersonation.ts       # Login como usuario
├── types.ts
└── index.ts
```

#### 3.2 Paginas Dinamicas

Baseado na analise do PRD, gerar paginas de CRUD:

```typescript
// Exemplo: Se PRD tem "Tasks" e "Projects"
const dynamicPages = [
  { path: 'tasks', component: 'AdminTasks', entity: 'tasks' },
  { path: 'projects', component: 'AdminProjects', entity: 'projects' },
];
```

### 4. Acesso ao Admin Panel

#### 4.1 Verificacao de Acesso

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

#### 4.2 Feature "Admin Panel" no Sistema de Roles

A feature "Admin Panel" e uma feature especial do sistema de roles do projeto:

```typescript
// Quando usuario tem role com feature 'admin_panel' = true
// Ele pode acessar /admin

// Dentro do admin, verificar role especifica do admin
const adminRole = user.admin_role; // 'admin_super', 'admin_viewer', etc.
```

### 5. Roles do Admin Panel

O Admin Panel tem suas proprias roles, separadas das roles do projeto:

#### 5.1 Tabela de Admin Roles

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

#### 5.2 Hook de Permissoes do Admin

```typescript
// src/features/admin/hooks/useAdminPermissions.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

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

### 6. Componentes Base

#### 6.1 AdminSidebar Dinamico

```tsx
// src/features/admin/components/AdminSidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAdminPermissions } from '../hooks/useAdminPermissions';
import {
  LayoutDashboard,
  Users,
  Shield,
  CreditCard,
  FileText,
  Settings,
  // Icones dinamicos baseados no PRD
} from 'lucide-react';

// Navegacao base (sempre presente)
const baseNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', resource: null },
  { icon: Users, label: 'Usuarios', href: '/admin/users', resource: 'users' },
  { icon: Shield, label: 'Audit Logs', href: '/admin/audit-logs', resource: 'audit_logs' },
];

// Navegacao dinamica (baseada no PRD)
// O agente deve gerar isso baseado nas entidades do PRD
const entityNavItems = [
  // Exemplo: Se PRD tem Tasks
  // { icon: CheckSquare, label: 'Tasks', href: '/admin/tasks', resource: 'entities.tasks' },
];

// Se tem pagamentos
const paymentNavItems = [
  { icon: CreditCard, label: 'Assinaturas', href: '/admin/subscriptions', resource: 'subscriptions' },
];

export function AdminSidebar() {
  const location = useLocation();
  const { can } = useAdminPermissions();

  // Filtrar items baseado em permissoes
  const navItems = [
    ...baseNavItems,
    ...entityNavItems,
    // Adicionar pagamentos apenas se existirem
  ].filter(item => !item.resource || can(item.resource, 'view'));

  return (
    <aside className="w-64 bg-card border-r flex flex-col">
      {/* ... render nav items */}
    </aside>
  );
}
```

#### 6.2 DataTable Generico

```tsx
// src/features/admin/components/DataTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              {columns.map((col, i) => (
                <TableCell key={i}>
                  {col.cell
                    ? col.cell(row)
                    : col.accessorKey
                    ? String(row[col.accessorKey])
                    : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Mostrando {pagination.page * pagination.pageSize + 1} -{' '}
            {Math.min((pagination.page + 1) * pagination.pageSize, pagination.total)} de{' '}
            {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 0}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(pagination.page + 1) * pagination.pageSize >= pagination.total}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 7. CRUDs por Entidade

Para cada entidade do PRD, gerar:

#### 7.1 Pagina de Listagem

```tsx
// src/features/admin/pages/Admin[Entity].tsx
// Exemplo: AdminTasks.tsx

import { useState } from 'react';
import { useAdminEntity } from '../hooks/useAdminEntity';
import { DataTable } from '../components/DataTable';
import { useAdminPermissions } from '../hooks/useAdminPermissions';

export function AdminTasks() {
  const [page, setPage] = useState(0);
  const { can } = useAdminPermissions();

  const { data, isLoading, pagination } = useAdminEntity({
    entity: 'tasks',
    page,
    pageSize: 20,
  });

  const columns = [
    // Colunas baseadas no schema da entidade
    { header: 'Titulo', accessorKey: 'title' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Criado em', cell: (row) => formatDate(row.created_at) },
    {
      header: '',
      cell: (row) => (
        <DropdownMenu>
          {/* Acoes baseadas em permissoes */}
          {can('entities.tasks', 'view') && <ViewAction id={row.id} />}
          {can('entities.tasks', 'edit') && <EditAction id={row.id} />}
          {can('entities.tasks', 'delete') && <DeleteAction id={row.id} />}
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        pagination={{ ...pagination, onPageChange: setPage }}
      />
    </div>
  );
}
```

#### 7.2 Hook Generico de Entidade

```typescript
// src/features/admin/hooks/useAdminEntity.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

interface UseAdminEntityOptions {
  entity: string;
  page?: number;
  pageSize?: number;
  filters?: Record<string, unknown>;
}

export function useAdminEntity({ entity, page = 0, pageSize = 20, filters }: UseAdminEntityOptions) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', entity, { page, pageSize, filters }],
    queryFn: async () => {
      let q = supabase
        .from(entity)
        .select('*', { count: 'exact' })
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) q = q.eq(key, value);
        });
      }

      const { data, count, error } = await q;
      if (error) throw error;

      return { items: data, total: count };
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase.from(entity).update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', entity] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(entity).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', entity] }),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    pagination: {
      page,
      pageSize,
      total: query.data?.total || 0,
    },
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
  };
}
```

### 8. Assinaturas (Se Houver Pagamentos)

Gerar APENAS se o PRD especificar gateway de pagamento:

```tsx
// src/features/admin/pages/AdminSubscriptions.tsx
export function AdminSubscriptions() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false });
      return data;
    },
  });

  const columns = [
    {
      header: 'Usuario',
      cell: (sub) => (
        <div>
          <p className="font-medium">{sub.profiles?.full_name}</p>
          <p className="text-sm text-muted-foreground">{sub.profiles?.email}</p>
        </div>
      ),
    },
    { header: 'Plano', accessorKey: 'plan_name' },
    {
      header: 'Status',
      cell: (sub) => (
        <Badge variant={sub.status === 'active' ? 'success' : 'secondary'}>
          {sub.status}
        </Badge>
      ),
    },
    { header: 'Valor', cell: (sub) => formatCurrency(sub.price_amount) },
    { header: 'Expira em', cell: (sub) => formatDate(sub.current_period_end) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Assinaturas</h1>
      <DataTable columns={columns} data={data || []} isLoading={isLoading} />
    </div>
  );
}
```

### 9. Dashboard Adaptavel

O dashboard deve mostrar metricas relevantes ao projeto:

```tsx
// src/features/admin/pages/AdminDashboard.tsx
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <StatsCard key={metric.title} {...metric} />
        ))}
      </div>
    </div>
  );
}
```

### 10. Barras Promocionais

O Admin Panel inclui um editor de barras promocionais que aparecem no topo da aplicacao.

#### 10.1 Tabelas

```sql
-- ============================================
-- BARRAS PROMOCIONAIS
-- ============================================

CREATE TABLE public.promotional_bars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conteudo
  text TEXT NOT NULL,                -- Texto da barra
  cta_text TEXT,                     -- Texto do botao (opcional)
  cta_url TEXT,                      -- URL destino do CTA

  -- Estilo
  background_color TEXT DEFAULT '#3B82F6',  -- Cor de fundo (hex)
  text_color TEXT DEFAULT '#FFFFFF',        -- Cor do texto (hex)

  -- Comportamento
  closeable BOOLEAN DEFAULT true,    -- Usuario pode fechar (x)
  is_active BOOLEAN DEFAULT false,   -- Barra ativa

  -- Agendamento
  starts_at TIMESTAMPTZ,             -- Data inicio (null = imediato)
  ends_at TIMESTAMPTZ,               -- Data fim (null = indefinido)

  -- Segmentacao (opcional)
  target_plans TEXT[],               -- Planos alvo (null = todos)
  target_roles TEXT[],               -- Roles alvo (null = todos)

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Registro de fechamentos por usuario
CREATE TABLE public.promotional_bar_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID REFERENCES promotional_bars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(bar_id, user_id)
);

-- RLS
ALTER TABLE promotional_bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_bar_dismissals ENABLE ROW LEVEL SECURITY;

-- Qualquer usuario pode ler barras ativas
CREATE POLICY "anyone_read_active_bars"
ON promotional_bars FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at > now())
);

-- Admins podem gerenciar barras
CREATE POLICY "admins_manage_bars"
ON promotional_bars FOR ALL
TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));

-- Usuario pode registrar fechamento
CREATE POLICY "users_own_dismissals"
ON promotional_bar_dismissals FOR ALL
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));
```

#### 10.2 Componentes

```
src/features/admin/
├── pages/
│   └── AdminPromotionalBars.tsx     # Listagem e gerenciamento
├── components/
│   ├── PromotionalBarEditor.tsx     # Editor com formulario
│   └── PromotionalBarPreview.tsx    # Preview em tempo real

src/components/layout/
└── PromotionalBar.tsx               # Componente no layout principal
```

#### 10.3 PromotionalBarEditor.tsx

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PromotionalBarPreview } from './PromotionalBarPreview';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

const barSchema = z.object({
  text: z.string().min(1, 'Texto obrigatorio').max(200),
  cta_text: z.string().max(30).optional(),
  cta_url: z.string().url().optional().or(z.literal('')),
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  closeable: z.boolean(),
  is_active: z.boolean(),
  starts_at: z.date().optional().nullable(),
  ends_at: z.date().optional().nullable(),
});

type BarFormData = z.infer<typeof barSchema>;

interface PromotionalBarEditorProps {
  initialData?: Partial<BarFormData>;
  onSave: (data: BarFormData) => void;
  isLoading?: boolean;
}

export function PromotionalBarEditor({ initialData, onSave, isLoading }: PromotionalBarEditorProps) {
  const form = useForm<BarFormData>({
    resolver: zodResolver(barSchema),
    defaultValues: {
      text: '',
      cta_text: '',
      cta_url: '',
      background_color: '#3B82F6',
      text_color: '#FFFFFF',
      closeable: true,
      is_active: false,
      starts_at: null,
      ends_at: null,
      ...initialData,
    },
  });

  const watchedValues = form.watch();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulario */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Configurar Barra</h3>

        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
          {/* Texto */}
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texto da barra</FormLabel>
                <FormControl>
                  <Input placeholder="Aproveite 20% de desconto!" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CTA */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cta_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto do botao</FormLabel>
                  <FormControl>
                    <Input placeholder="Assinar agora" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cta_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL destino</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Cores */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="background_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor de fundo</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input type="color" className="w-12 h-10 p-1" {...field} />
                      <Input {...field} />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="text_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor do texto</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input type="color" className="w-12 h-10 p-1" {...field} />
                      <Input {...field} />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Opcoes */}
          <div className="flex items-center gap-6">
            <FormField
              control={form.control}
              name="closeable"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Pode fechar (x)</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Ativa</FormLabel>
                </FormItem>
              )}
            />
          </div>

          {/* Agendamento */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="starts_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data inicio</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'dd/MM/yyyy') : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ends_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data fim</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'dd/MM/yyyy') : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="border rounded-lg overflow-hidden">
          <PromotionalBarPreview bar={watchedValues} />
          <div className="h-40 bg-muted/30 flex items-center justify-center text-muted-foreground">
            Conteudo do app
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 10.4 PromotionalBar.tsx (Layout)

```tsx
// src/components/layout/PromotionalBar.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromotionalBarData {
  id: string;
  text: string;
  cta_text?: string;
  cta_url?: string;
  background_color: string;
  text_color: string;
  closeable: boolean;
}

export function PromotionalBar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar barra ativa (respeitando dismissals)
  const { data: bar } = useQuery({
    queryKey: ['promotional-bar', user?.id],
    queryFn: async () => {
      // Buscar barras ativas
      const { data: bars } = await supabase
        .from('promotional_bars')
        .select('*')
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
        .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!bars?.length) return null;

      const bar = bars[0];

      // Verificar se usuario fechou esta barra
      if (user) {
        const { data: dismissal } = await supabase
          .from('promotional_bar_dismissals')
          .select('id')
          .eq('bar_id', bar.id)
          .eq('user_id', user.id)
          .single();

        if (dismissal) return null;
      }

      return bar as PromotionalBarData;
    },
    enabled: true,
  });

  // Fechar barra
  const dismissMutation = useMutation({
    mutationFn: async (barId: string) => {
      if (!user) return;
      await supabase.from('promotional_bar_dismissals').insert({
        bar_id: barId,
        user_id: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-bar'] });
    },
  });

  if (!bar) return null;

  return (
    <div
      className="relative py-2 px-4 text-center text-sm"
      style={{
        backgroundColor: bar.background_color,
        color: bar.text_color,
      }}
    >
      <span>{bar.text}</span>

      {bar.cta_text && bar.cta_url && (
        <a
          href={bar.cta_url}
          className="ml-4 underline font-medium hover:no-underline"
          style={{ color: bar.text_color }}
        >
          {bar.cta_text}
        </a>
      )}

      {bar.closeable && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
          style={{ color: bar.text_color }}
          onClick={() => dismissMutation.mutate(bar.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

---

### 11. Criacao de Notificacoes

O Admin Panel inclui um wizard para criar e enviar notificacoes para usuarios.

#### 11.1 Tabela

```sql
-- Historico de notificacoes enviadas pelo admin
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conteudo
  title TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Canais usados
  channels TEXT[] NOT NULL,          -- ['internal', 'email', 'push']

  -- Segmentacao
  target_all BOOLEAN DEFAULT false,
  target_user_ids UUID[],            -- Lista de usuarios especificos
  target_plans TEXT[],               -- Planos alvo
  target_roles TEXT[],               -- Roles alvo

  -- Estatisticas
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_admin_notifications"
ON admin_notifications FOR ALL
TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));
```

#### 11.2 Componentes

```
src/features/admin/
├── pages/
│   └── AdminNotifications.tsx       # Listagem + wizard
├── components/
│   ├── NotificationWizard.tsx       # Wizard principal
│   ├── ChannelSelector.tsx          # Passo 1: selecionar canais
│   ├── NotificationEditor.tsx       # Passo 2: titulo e corpo
│   ├── AudienceSelector.tsx         # Passo 3: segmentacao
│   └── NotificationPreview.tsx      # Passo 4: preview por canal
```

#### 11.3 NotificationWizard.tsx

```tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/components/ui/button';
import { ChannelSelector } from './ChannelSelector';
import { NotificationEditor } from './NotificationEditor';
import { AudienceSelector } from './AudienceSelector';
import { NotificationPreview } from './NotificationPreview';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

type Step = 'channels' | 'content' | 'audience' | 'preview';

interface NotificationData {
  channels: ('internal' | 'email' | 'push')[];
  title: string;
  body: string;
  targetAll: boolean;
  targetUserIds: string[];
  targetPlans: string[];
  targetRoles: string[];
}

export function NotificationWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>('channels');
  const [data, setData] = useState<NotificationData>({
    channels: ['internal'],
    title: '',
    body: '',
    targetAll: true,
    targetUserIds: [],
    targetPlans: [],
    targetRoles: [],
  });

  const queryClient = useQueryClient();

  const steps: Step[] = ['channels', 'content', 'audience', 'preview'];
  const currentStepIndex = steps.indexOf(step);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('admin-send-notification', {
        body: data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      onComplete();
    },
  });

  const canProceed = () => {
    switch (step) {
      case 'channels':
        return data.channels.length > 0;
      case 'content':
        return data.title.trim().length > 0 && data.body.trim().length > 0;
      case 'audience':
        return data.targetAll || data.targetUserIds.length > 0 ||
               data.targetPlans.length > 0 || data.targetRoles.length > 0;
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i <= currentStepIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-20 h-1 mx-2 ${
                  i < currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {step === 'channels' && (
          <ChannelSelector
            value={data.channels}
            onChange={(channels) => setData({ ...data, channels })}
          />
        )}
        {step === 'content' && (
          <NotificationEditor
            title={data.title}
            body={data.body}
            onTitleChange={(title) => setData({ ...data, title })}
            onBodyChange={(body) => setData({ ...data, body })}
          />
        )}
        {step === 'audience' && (
          <AudienceSelector
            targetAll={data.targetAll}
            targetUserIds={data.targetUserIds}
            targetPlans={data.targetPlans}
            targetRoles={data.targetRoles}
            onChange={(audience) => setData({ ...data, ...audience })}
          />
        )}
        {step === 'preview' && (
          <NotificationPreview
            channels={data.channels}
            title={data.title}
            body={data.body}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(steps[currentStepIndex - 1])}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {step === 'preview' ? (
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
          >
            {sendMutation.isPending ? 'Enviando...' : 'Enviar Notificacao'}
          </Button>
        ) : (
          <Button
            onClick={() => setStep(steps[currentStepIndex + 1])}
            disabled={!canProceed()}
          >
            Proximo
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

#### 11.4 NotificationPreview.tsx

```tsx
import { Bell, Mail, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NotificationPreviewProps {
  channels: ('internal' | 'email' | 'push')[];
  title: string;
  body: string;
}

export function NotificationPreview({ channels, title, body }: NotificationPreviewProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Preview por Canal</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Preview Interno */}
        {channels.includes('internal') && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Interno (Sininho)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-3">
                <p className="font-medium text-sm">{title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{body}</p>
                <p className="text-xs text-muted-foreground mt-2">Agora</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Email */}
        {channels.includes('email') && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="border-b pb-2">
                  <p className="text-xs text-muted-foreground">De: noreply@app.com</p>
                  <p className="text-xs text-muted-foreground">Assunto: {title}</p>
                </div>
                <p className="text-sm">{body}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Push */}
        {channels.includes('push') && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push (PWA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{body}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

---

### 12. Configuracao do AI Assistant

O Admin Panel permite configurar **apenas parametros tecnicos** do assistente de IA.

**IMPORTANTE**:
- Tom de voz vem do **BRAND.md**, nao e configuravel no admin
- TODAS as mensagens (incluindo boas-vindas) sao geradas pela IA
- Nao existe mensagem pre-definida ou fallback estatico

**Campos configuráveis no Admin**:
- `assistant_name` - Nome que a IA usa para se apresentar
- `nps_enabled` - Habilitar/desabilitar NPS
- `nps_delay_seconds` - Tempo antes de sugerir NPS

**Campos NAO configuráveis** (vem do BRAND.md):
- Tom de voz
- Estilo de comunicacao
- Personalidade

Ver detalhes completos em `.architecture/agents/ai-support-agent.md`.

---

### 13. Output Final

```markdown
## Admin Panel Gerado

**Baseado no PRD**: [Nome do Projeto]

### Paginas Geradas

| Pagina | Descricao |
|--------|-----------|
| Dashboard | Metricas: [lista baseada no PRD] |
| Usuarios | CRUD de usuarios |
| Audit Logs | Visualizacao de logs |
| Roles | Gestao de roles do admin |
| [Entidades do PRD] | CRUDs especificos |
| Assinaturas | Se houver pagamentos |

### Acesso

- Controlado pela feature "Admin Panel" nas roles do projeto
- Roles internas do admin: super_admin, support, viewer

### Proximos Passos (Humano)

Ver checklist em `.architecture/docs/12-checklist-humano.md`:
- Definir usuarios com acesso ao admin (adicionar feature "Admin Panel")
- Configurar roles internas do admin conforme necessidade
```

---

## Integracao

### Quando Sou Chamado

1. Meta-Orchestrator invoca na Fase 4
2. Recebo PRD.md e DATABASE.md
3. Analiso entidades e funcionalidades
4. Gero estrutura adaptada ao projeto

### Arquivos Referenciados

- `PRD.md` - Entidades e funcionalidades
- `DATABASE.md` - Schema para queries
- `.architecture/docs/04-seguranca.md` - RBAC, Audit Logging

### Arquivos Gerados

- `src/features/admin/**/*`
- `src/app/router/admin-routes.tsx`
- `supabase/migrations/*_admin_roles.sql` (se nao existir)

---

## Manutencao do Projeto (Pos-Geracao)

O Admin Panel Agent NAO e usado apenas na geracao inicial. Ele e invocado para **manter** o painel administrativo ao longo do tempo.

### Quando Sou Invocado para Manutencao

```
Voce e o Admin Panel Agent (.architecture/agents/admin-panel-agent.md).
MODO: Manutencao

Tarefa: [adicionar|modificar|remover] [pagina/funcionalidade]
Contexto: [descricao da mudanca]
```

### Tipos de Manutencao

#### Adicionar CRUD de Nova Entidade

Quando uma nova entidade e criada no projeto:

1. Analisar schema da entidade no DATABASE.md
2. Criar pagina `Admin[Entity].tsx`
3. Adicionar item no AdminSidebar
4. Definir colunas da DataTable
5. Configurar permissoes no sistema de roles
6. Atualizar documentacao

#### Modificar Pagina Existente

Quando uma entidade e alterada:

1. Verificar novas colunas/relacionamentos no DATABASE.md
2. Atualizar colunas da DataTable
3. Ajustar formularios de edicao
4. Atualizar filtros (se houver)

#### Adicionar Nova Metrica ao Dashboard

Quando precisa mostrar nova metrica:

1. Adicionar query em `useAdminStats.ts`
2. Adicionar card em `AdminDashboard.tsx`
3. Escolher icone apropriado

#### Adicionar Nova Role do Admin

Quando precisa nova role interna:

1. Inserir em `admin_roles`
2. Definir permissoes no JSON
3. Atualizar documentacao de permissoes

#### Atualizar Barras Promocionais

Quando alterar comportamento das barras:

1. Modificar schema se necessario
2. Atualizar editor/preview
3. Ajustar componente no layout

#### Atualizar Wizard de Notificacoes

Quando adicionar novo canal ou segmentacao:

1. Atualizar ChannelSelector
2. Modificar AudienceSelector
3. Ajustar Edge Function de envio

### Checklist de Manutencao

- [ ] Novas entidades tem CRUD no admin
- [ ] Permissoes configuradas para novas paginas
- [ ] Metricas relevantes no dashboard
- [ ] Documentacao de roles atualizada
- [ ] Testes de permissoes funcionando

### Template de Session (Manutencao)

```markdown
[SESSION]
Timestamp: YYYY-MM-DDTHH:MM-03:00
Agente: Admin Panel Agent
Solicitante: [Quem solicitou]
Modo: Manutencao

Tarefa: [adicionar|modificar|remover] [elemento]

Mudancas:
- [lista de mudancas]

Arquivos modificados:
- [lista]

Conclusao:
[Descricao do que foi feito]
```

---

## Sessao (Geracao Inicial)

```markdown
[SESSION]
Timestamp: YYYY-MM-DDTHH:MM-03:00
Agente: Admin Panel Agent
Solicitante: Meta-Orchestrator

Tarefa:
- Gerar Admin Panel adaptado ao PRD

Input:
- PRD.md: [entidades identificadas]
- DATABASE.md: [tabelas]
- Pagamentos: [sim/nao, gateway]

Output:
- Paginas: [N]
- CRUDs de entidades: [lista]
- Assinaturas: [sim/nao]

Conclusao:
Admin Panel gerado com sucesso.
```
