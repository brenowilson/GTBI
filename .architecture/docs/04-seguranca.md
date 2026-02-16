# Seguranca

## Visao Geral

Este documento define os padroes de seguranca obrigatorios para projetos derivados do framework, baseados em OWASP Top 10 e melhores praticas para React + Supabase.

---

## OWASP Top 10 - Checklist React/Supabase

### 1. Injection (SQL, XSS)

| Risco | Mitigacao | Status |
|-------|-----------|--------|
| SQL Injection | Supabase usa queries parametrizadas por padrao | Coberto |
| XSS | React escapa automaticamente; usar DOMPurify se dangerouslySetInnerHTML necessario | Coberto |
| Command Injection | Edge Functions: validar/sanitizar todos inputs | Manual |

```typescript
// Se precisar de dangerouslySetInnerHTML
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />
```

### 2. Broken Authentication

| Risco | Mitigacao |
|-------|-----------|
| Senhas fracas | Requisitos minimos obrigatorios (ver abaixo) |
| Session hijacking | HttpOnly cookies, secure flag, SameSite=Strict |
| Token exposure | NUNCA armazenar JWT em localStorage |

```typescript
// ERRADO: localStorage
localStorage.setItem('token', session.access_token);

// CERTO: Supabase gerencia automaticamente em cookies
const { data: { session } } = await supabase.auth.getSession();
```

#### Requisitos de Senha (OBRIGATORIO)

Todas as senhas devem atender aos seguintes criterios:

| Requisito | Minimo |
|-----------|--------|
| Comprimento | 8 caracteres |
| Letra maiuscula | 1 |
| Letra minuscula | 1 |
| Digito numerico | 1 |
| Caractere especial | 1 (!@#$%^&*()_+-=[]{};\|:'"<>,.?/) |

**Validacao no Frontend:**

```typescript
// src/shared/lib/password-validation.ts
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push('Senha deve ter no minimo 8 caracteres');
  }
  if (!PASSWORD_REQUIREMENTS.hasUppercase.test(password)) {
    errors.push('Senha deve conter ao menos uma letra maiuscula');
  }
  if (!PASSWORD_REQUIREMENTS.hasLowercase.test(password)) {
    errors.push('Senha deve conter ao menos uma letra minuscula');
  }
  if (!PASSWORD_REQUIREMENTS.hasNumber.test(password)) {
    errors.push('Senha deve conter ao menos um numero');
  }
  if (!PASSWORD_REQUIREMENTS.hasSpecialChar.test(password)) {
    errors.push('Senha deve conter ao menos um caractere especial');
  }

  return { valid: errors.length === 0, errors };
}
```

**Componente de Indicador de Forca:**

```tsx
// src/components/ui/password-strength.tsx
import { validatePassword, PASSWORD_REQUIREMENTS } from '@/shared/lib/password-validation';

export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Minimo 8 caracteres', met: password.length >= 8 },
    { label: 'Letra maiuscula', met: PASSWORD_REQUIREMENTS.hasUppercase.test(password) },
    { label: 'Letra minuscula', met: PASSWORD_REQUIREMENTS.hasLowercase.test(password) },
    { label: 'Numero', met: PASSWORD_REQUIREMENTS.hasNumber.test(password) },
    { label: 'Caractere especial', met: PASSWORD_REQUIREMENTS.hasSpecialChar.test(password) },
  ];

  return (
    <ul className="text-sm space-y-1 mt-2">
      {checks.map((check) => (
        <li key={check.label} className={check.met ? 'text-green-600' : 'text-muted-foreground'}>
          {check.met ? '✓' : '○'} {check.label}
        </li>
      ))}
    </ul>
  );
}
```

**Configuracao no Supabase (Dashboard > Authentication > Policies):**

O Supabase permite configurar requisitos de senha via dashboard. Configure:
- Minimum password length: 8
- Require uppercase: Yes
- Require lowercase: Yes
- Require numbers: Yes
- Require special characters: Yes

### 3. Sensitive Data Exposure

| Dado | Armazenamento |
|------|---------------|
| API Keys | GitHub Secrets / Vercel Env Vars |
| Database credentials | NUNCA no frontend |
| User PII | Criptografado em repouso (Supabase default) |

### 4. Broken Access Control

Ver secao RLS abaixo.

---

## Row Level Security (RLS)

### Regras Obrigatorias

1. **SEMPRE habilitar RLS** em tabelas com dados de usuarios
2. **SEMPRE especificar role** (`TO authenticated`)
3. **SEMPRE usar app_metadata** (nao user_metadata)
4. **SEMPRE testar policies** antes do merge

### Template Basico

**IMPORTANTE**: Sempre usar `(select auth.uid())` em vez de `auth.uid()` diretamente para melhor performance. O subquery faz o valor ser calculado uma vez e cacheado, em vez de recalculado para cada linha.

```sql
-- 1. Habilitar RLS (OBRIGATORIO)
ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;

-- 2. Policy de SELECT
CREATE POLICY "users_select_own"
ON nome_tabela
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

-- 3. Policy de INSERT
CREATE POLICY "users_insert_own"
ON nome_tabela
FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

-- 4. Policy de UPDATE
CREATE POLICY "users_update_own"
ON nome_tabela
FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- 5. Policy de DELETE
CREATE POLICY "users_delete_own"
ON nome_tabela
FOR DELETE
TO authenticated
USING (user_id = (select auth.uid()));
```

### Multi-Tenancy com app_metadata

```sql
-- Funcao helper para obter tenant_id do JWT
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS TEXT AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::TEXT;
$$ LANGUAGE SQL STABLE;

-- Policy de isolamento por tenant
CREATE POLICY "tenant_isolation"
ON tenant_data
FOR ALL
TO authenticated
USING (tenant_id = get_tenant_id())
WITH CHECK (tenant_id = get_tenant_id());
```

### Anti-Patterns de RLS

| Anti-Pattern | Problema | Solucao |
|-------------|----------|---------|
| `user_metadata` em policies | Usuario pode modificar | Usar `app_metadata` |
| Sem role especificado | Aplica a anon tambem | Adicionar `TO authenticated` |
| `auth.uid()` sem wrapper | Performance | Usar `(select auth.uid())` |
| Views sem security_invoker | Bypass de RLS | Adicionar `security_invoker = true` |

```sql
-- ERRADO: user_metadata (usuario pode modificar)
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')

-- CERTO: app_metadata (servidor controla)
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
```

### Performance em RLS

```sql
-- ERRADO: auth.uid() chamado multiplas vezes
USING (user_id = auth.uid() OR created_by = auth.uid())

-- CERTO: cached com subquery
USING (user_id = (select auth.uid()) OR created_by = (select auth.uid()))
```

---

## RBAC Hierarquico do Projeto

### Visao Geral

O sistema de roles do projeto usa uma hierarquia de 3 niveis:

```
Grupos de Features → Features → Acoes
```

Exemplo:
- **Grupo**: "Gestao de Tarefas"
  - **Feature**: "Tarefas"
    - **Acoes**: criar, editar, deletar, arquivar
  - **Feature**: "Projetos"
    - **Acoes**: criar, editar, deletar

### Schema do Sistema de Roles

```sql
-- ============================================
-- SISTEMA DE ROLES HIERARQUICO
-- ============================================

-- Tabela de Roles do projeto
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,  -- Role padrao para novos usuarios
  is_admin BOOLEAN DEFAULT false,    -- Role admin (acesso total)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grupos de Features (nivel 1)
CREATE TABLE public.feature_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,         -- 'task_management', 'billing', 'settings'
  display_name TEXT NOT NULL,        -- 'Gestao de Tarefas'
  description TEXT,
  sort_order INT DEFAULT 0
);

-- Features (nivel 2)
CREATE TABLE public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES feature_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE,         -- 'tasks', 'projects', 'admin_panel'
  display_name TEXT NOT NULL,        -- 'Tarefas'
  description TEXT,
  sort_order INT DEFAULT 0
);

-- Acoes das Features (nivel 3)
CREATE TABLE public.feature_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                -- 'create', 'edit', 'delete', 'view'
  display_name TEXT NOT NULL,        -- 'Criar'
  description TEXT,
  UNIQUE(feature_id, name)
);

-- Permissoes da Role (quais acoes cada role pode executar)
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  feature_action_id UUID REFERENCES feature_actions(id) ON DELETE CASCADE,
  UNIQUE(role_id, feature_action_id)
);

-- Associacao usuario <-> role
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role_id)
);

-- Indices para performance
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_action ON role_permissions(feature_action_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_features_group ON features(group_id);
CREATE INDEX idx_feature_actions_feature ON feature_actions(feature_id);

-- ============================================
-- RLS PARA TABELAS DE SISTEMA DE ROLES
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem LER tabelas de roles (necessario para sistema funcionar)
CREATE POLICY "authenticated_read_roles"
ON roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_feature_groups"
ON feature_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_features"
ON features FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_feature_actions"
ON feature_actions FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_role_permissions"
ON role_permissions FOR SELECT TO authenticated USING (true);

-- Usuario pode ver suas proprias associacoes de role
CREATE POLICY "users_read_own_roles"
ON user_roles FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

-- Admins podem gerenciar todas as tabelas de roles
CREATE POLICY "admins_manage_roles"
ON roles FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));

CREATE POLICY "admins_manage_feature_groups"
ON feature_groups FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));

CREATE POLICY "admins_manage_features"
ON features FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));

CREATE POLICY "admins_manage_feature_actions"
ON feature_actions FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));

CREATE POLICY "admins_manage_role_permissions"
ON role_permissions FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));

CREATE POLICY "admins_manage_user_roles"
ON user_roles FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));
```

### Dados Padrao

```sql
-- Role Admin padrao (acesso total)
INSERT INTO roles (name, description, is_admin) VALUES
  ('admin', 'Administrador com acesso total', true);

-- Role Member padrao
INSERT INTO roles (name, description, is_default) VALUES
  ('member', 'Membro padrao', true);

-- Grupo "Sistema" com feature "Admin Panel"
INSERT INTO feature_groups (name, display_name, sort_order) VALUES
  ('system', 'Sistema', 100);

INSERT INTO features (group_id, name, display_name) VALUES
  ((SELECT id FROM feature_groups WHERE name = 'system'), 'admin_panel', 'Painel Admin');

INSERT INTO feature_actions (feature_id, name, display_name) VALUES
  ((SELECT id FROM features WHERE name = 'admin_panel'), 'access', 'Acessar');

-- Admin tem acesso ao Admin Panel
INSERT INTO role_permissions (role_id, feature_action_id)
SELECT r.id, fa.id
FROM roles r, feature_actions fa
JOIN features f ON fa.feature_id = f.id
WHERE r.name = 'admin' AND f.name = 'admin_panel';
```

### Funcoes Helper

```sql
-- Verificar se usuario tem permissao para uma acao
CREATE OR REPLACE FUNCTION public.user_can(
  p_user_id UUID,
  p_feature TEXT,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_has_permission BOOLEAN;
BEGIN
  -- Verificar se usuario tem role admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id AND r.is_admin = true
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Verificar permissao especifica
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN feature_actions fa ON rp.feature_action_id = fa.id
    JOIN features f ON fa.feature_id = f.id
    WHERE ur.user_id = p_user_id
      AND f.name = p_feature
      AND fa.name = p_action
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se usuario tem acesso a uma feature (qualquer acao)
CREATE OR REPLACE FUNCTION public.user_has_feature(
  p_user_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_has_feature BOOLEAN;
BEGIN
  -- Verificar se usuario tem role admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id AND r.is_admin = true
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Verificar se tem qualquer acao na feature
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN feature_actions fa ON rp.feature_action_id = fa.id
    JOIN features f ON fa.feature_id = f.id
    WHERE ur.user_id = p_user_id
      AND f.name = p_feature
  ) INTO v_has_feature;

  RETURN v_has_feature;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obter todas as permissoes de um usuario (para carregar no frontend)
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_permissions JSONB;
BEGIN
  -- Verificar se e admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id AND r.is_admin = true
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN jsonb_build_object('is_admin', true);
  END IF;

  -- Montar objeto de permissoes
  SELECT jsonb_build_object(
    'is_admin', false,
    'permissions', jsonb_object_agg(
      f.name,
      (SELECT jsonb_agg(fa.name)
       FROM role_permissions rp2
       JOIN feature_actions fa ON rp2.feature_action_id = fa.id
       WHERE rp2.role_id = ANY(
         SELECT role_id FROM user_roles WHERE user_id = p_user_id
       ) AND fa.feature_id = f.id)
    )
  )
  FROM features f
  WHERE EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN feature_actions fa ON rp.feature_action_id = fa.id
    WHERE ur.user_id = p_user_id AND fa.feature_id = f.id
  )
  INTO v_permissions;

  RETURN COALESCE(v_permissions, jsonb_build_object('is_admin', false, 'permissions', '{}'::jsonb));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Hook de Permissions no Frontend

```typescript
// src/features/roles/hooks/useUserPermissions.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/shared/lib/supabase';

interface UserPermissions {
  is_admin: boolean;
  permissions: Record<string, string[]>; // { feature: ['action1', 'action2'] }
}

export function useUserPermissions() {
  const { user } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_user_permissions', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as UserPermissions;
    },
    enabled: !!user,
  });

  // Verificar se pode executar uma acao
  const can = (feature: string, action: string): boolean => {
    if (!permissions) return false;
    if (permissions.is_admin) return true;

    const featurePermissions = permissions.permissions[feature];
    return featurePermissions?.includes(action) ?? false;
  };

  // Verificar se tem acesso a uma feature (qualquer acao)
  const hasFeature = (feature: string): boolean => {
    if (!permissions) return false;
    if (permissions.is_admin) return true;

    return feature in permissions.permissions;
  };

  // Verificar se e admin
  const isAdmin = permissions?.is_admin ?? false;

  return {
    permissions,
    isLoading,
    can,
    hasFeature,
    isAdmin,
  };
}
```

### Uso no Frontend

```tsx
// Exemplo: Ocultar botao se nao tem permissao
import { useUserPermissions } from '@/features/roles/hooks/useUserPermissions';

export function TaskActions({ task }) {
  const { can } = useUserPermissions();

  return (
    <div>
      {can('tasks', 'edit') && (
        <Button onClick={() => editTask(task)}>Editar</Button>
      )}
      {can('tasks', 'delete') && (
        <Button variant="destructive" onClick={() => deleteTask(task)}>
          Deletar
        </Button>
      )}
    </div>
  );
}

// Exemplo: Verificar acesso ao Admin Panel
export function AppLayout() {
  const { hasFeature } = useUserPermissions();

  return (
    <nav>
      {/* ... outras opcoes ... */}
      {hasFeature('admin_panel') && (
        <Link to="/admin">Admin Panel</Link>
      )}
    </nav>
  );
}
```

### RLS com Permissoes

```sql
-- Policy que verifica permissao do usuario
CREATE POLICY "users_can_edit_tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (
  -- Dono pode sempre editar
  user_id = auth.uid()
  OR
  -- Ou usuario tem permissao de editar tasks
  user_can(auth.uid(), 'tasks', 'edit')
);
```

### Interface de Gestao de Roles

O admin do projeto pode criar roles e definir permissoes:

```tsx
// src/features/roles/pages/RoleManager.tsx
export function RoleManager() {
  const { data: roles } = useRoles();
  const { data: featureGroups } = useFeatureGroups();

  return (
    <div>
      <h1>Gestao de Roles</h1>

      {/* Lista de roles */}
      <RoleList roles={roles} />

      {/* Ao clicar em uma role, mostrar permissoes */}
      <RolePermissionsEditor
        roleId={selectedRoleId}
        featureGroups={featureGroups}
      />
    </div>
  );
}
```

### Pontos Importantes

1. **Role Admin**: A role `is_admin = true` tem acesso total, sem verificar permissoes individuais
2. **Feature "Admin Panel"**: Feature especial que controla acesso ao painel administrativo
3. **Role Padrao**: Novos usuarios recebem a role `is_default = true`
4. **Hierarquia**: Grupos organizam features, features organizam acoes
5. **Frontend**: SEMPRE verificar permissoes e ocultar elementos sem acesso
6. **Backend**: SEMPRE usar RLS ou verificar permissoes nas Edge Functions

---

## Gestao de Secrets

### Por Plataforma

| Plataforma | Tipo | Pratica |
|------------|------|---------|
| **Local** | Desenvolvimento | `.env.local` (gitignored) |
| **GitHub** | CI/CD | Secrets por environment |
| **Vercel** | Runtime frontend | Environment Variables |
| **Supabase** | Runtime backend | Vault + Edge Function secrets |

### Variaveis de Ambiente

```bash
# .env.example (commitado - sem valores reais)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
```

```typescript
// shared/config/env.ts - tipagem de env vars
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});
```

### Regras de Nomenclatura

| Prefixo | Exposicao | Uso |
|---------|-----------|-----|
| `NEXT_PUBLIC_` / `VITE_` | Cliente (browser) | URLs publicas, anon keys |
| Sem prefixo | Servidor apenas | Service roles, API keys |

### NUNCA Commitar

```gitignore
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
service-account.json
```

---

## Validacao de Seguranca com Supashield

### Instalacao

```bash
npm install -g supashield
```

### Comandos

```bash
# Scan por issues comuns de RLS
supashield audit

# Relatorio de cobertura de RLS
supashield coverage

# Testa todas as policies
supashield test

# CI/CD: falha se issues criticas
supashield audit --fail-on-critical
```

### Integracao com CI

```yaml
# .github/workflows/security.yml
- name: RLS Audit
  run: |
    npm install -g supashield
    supashield audit --fail-on-critical
```

---

## Checklist Pre-Deploy

### Database

- [ ] RLS habilitado em todas as tabelas com dados de usuario
- [ ] Policies testadas com diferentes roles
- [ ] app_metadata usado (nao user_metadata)
- [ ] Sem queries raw expostas ao cliente

### Frontend

- [ ] Sem secrets em codigo client-side
- [ ] Sem localStorage para tokens
- [ ] CSP headers configurados
- [ ] HTTPS obrigatorio

### Backend (Edge Functions)

- [ ] Inputs validados com Zod
- [ ] CORS configurado corretamente
- [ ] Rate limiting implementado
- [ ] Logs sem dados sensiveis

### CI/CD

- [ ] Secrets em GitHub/Vercel (nao em codigo)
- [ ] Branch protection em main
- [ ] supashield no pipeline
- [ ] Sem .env commitado

---

## Cookies Seguros

```typescript
// Configuracao de cookies para auth
const cookieOptions = {
  httpOnly: true,      // Inacessivel via JavaScript
  secure: true,        // HTTPS apenas
  sameSite: 'Strict',  // CSRF protection
  maxAge: 60 * 60 * 24 * 7, // 7 dias
  path: '/',
};
```

---

## Headers de Seguranca

```typescript
// next.config.js ou vercel.json
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  },
];
```

---

## Audit Logging

### Visao Geral

Audit logs registram QUEM fez O QUE e QUANDO. Essencial para compliance, debug e seguranca.

### Tabela de Audit Logs

```sql
-- Tabela de audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Quem
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,

  -- O que
  action TEXT NOT NULL,           -- 'create', 'update', 'delete', 'login', etc.
  resource_type TEXT NOT NULL,    -- 'task', 'user', 'subscription', etc.
  resource_id UUID,

  -- Detalhes
  old_values JSONB,               -- Estado anterior (para updates/deletes)
  new_values JSONB,               -- Estado novo (para creates/updates)
  metadata JSONB,                 -- Dados extras (tenant_id, etc.)

  -- Indexacao
  tenant_id UUID
);

-- Indices para queries comuns
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- RLS: apenas admins podem ler logs (usuarios nao veem)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_audit"
ON audit_logs
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Ninguem pode modificar ou deletar logs (imutavel)
-- INSERT apenas via service_role ou trigger
```

### Funcao para Registrar Audit Log

```sql
CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    metadata,
    tenant_id
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_metadata,
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Trigger Automatico para Tabelas Criticas

```sql
-- Funcao generica para audit via trigger
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit('create', TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit('update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit('delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar em tabelas criticas
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

### Logs em Edge Functions

```typescript
// supabase/functions/_shared/audit.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function logAudit(params: {
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  await supabaseAdmin.from('audit_logs').insert({
    user_id: params.userId,
    user_email: params.userEmail,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    old_values: params.oldValues,
    new_values: params.newValues,
    metadata: params.metadata,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  });
}

// Uso
await logAudit({
  userId: user.id,
  userEmail: user.email,
  action: 'subscription_created',
  resourceType: 'subscription',
  resourceId: subscription.id,
  newValues: { plan: 'pro', price: 29.99 },
  ipAddress: req.headers.get('x-forwarded-for'),
});
```

### O que Logar

| Categoria | Acoes |
|-----------|-------|
| **Auth** | login, logout, password_reset, email_change |
| **Billing** | subscription_created, subscription_cancelled, payment_failed |
| **Data** | create, update, delete em entidades criticas |
| **Admin** | role_changed, user_deleted, settings_changed |
| **Security** | failed_login, suspicious_activity, api_key_created |

### Retencao de Logs

```sql
-- Job para limpar logs antigos (manter 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;

-- Agendar via pg_cron (Supabase Dashboard > Extensions > pg_cron)
SELECT cron.schedule(
  'cleanup-audit-logs',
  '0 3 * * *',  -- Todo dia as 3h
  'SELECT cleanup_old_audit_logs()'
);
```

---

## Rate Limiting

### Visao Geral

Rate limiting protege APIs contra abuso, DDoS e garante fair use.

### Rate Limiting em Edge Functions

```typescript
// supabase/functions/_shared/rate-limit.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface RateLimitConfig {
  key: string;           // Identificador (user_id, ip, api_key)
  limit: number;         // Max requests
  window: number;        // Janela em segundos
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.window * 1000);

  // Contar requests na janela
  const { count } = await supabaseAdmin
    .from('rate_limit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('key', config.key)
    .gte('created_at', windowStart.toISOString());

  const currentCount = count || 0;
  const allowed = currentCount < config.limit;

  if (allowed) {
    // Registrar request
    await supabaseAdmin.from('rate_limit_logs').insert({
      key: config.key,
      created_at: now.toISOString(),
    });
  }

  return {
    allowed,
    remaining: Math.max(0, config.limit - currentCount - 1),
    resetAt: new Date(windowStart.getTime() + config.window * 1000),
  };
}

```

### Schema da Tabela rate_limit_logs

```sql
-- Tabela para rate limiting
CREATE TABLE public.rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indice para busca rapida por key e tempo
CREATE INDEX idx_rate_limit_key ON rate_limit_logs(key, created_at);
```

### Middleware de Rate Limiting

```typescript
// supabase/functions/_shared/middleware.ts
import { checkRateLimit } from './rate-limit.ts';

// Limites por tipo de operacao
const RATE_LIMITS = {
  auth: { limit: 5, window: 60 },        // 5 req/min para login
  api: { limit: 100, window: 60 },       // 100 req/min para API geral
  webhook: { limit: 1000, window: 60 },  // 1000 req/min para webhooks
  export: { limit: 5, window: 3600 },    // 5 exports/hora
};

export async function rateLimitMiddleware(
  req: Request,
  type: keyof typeof RATE_LIMITS = 'api'
): Promise<Response | null> {
  const config = RATE_LIMITS[type];

  // Usar IP ou user_id como key
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userId = req.headers.get('x-user-id');
  const key = userId || `ip:${ip}`;

  const result = await checkRateLimit({
    key: `${type}:${key}`,
    limit: config.limit,
    window: config.window,
  });

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)} seconds.`,
        retryAfter: result.resetAt.toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetAt.toISOString(),
          'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null; // Permitido, continuar
}

// Uso em Edge Function
export async function handler(req: Request) {
  // Verificar rate limit
  const rateLimitResponse = await rateLimitMiddleware(req, 'api');
  if (rateLimitResponse) return rateLimitResponse;

  // Processar request normalmente
  // ...
}
```

### Rate Limiting com Redis (Alternativa)

Para aplicacoes de alta escala, usar Redis via Upstash:

```typescript
// Com Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 req/min
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  return { allowed: success, limit, remaining, resetAt: new Date(reset) };
}
```

### Limites Recomendados

| Endpoint | Limite | Janela | Justificativa |
|----------|--------|--------|---------------|
| `/auth/login` | 5 | 1 min | Prevenir brute force |
| `/auth/signup` | 3 | 1 hora | Prevenir spam de contas |
| `/api/*` | 100 | 1 min | Fair use |
| `/api/export` | 5 | 1 hora | Operacoes pesadas |
| `/webhooks/*` | 1000 | 1 min | Alta frequencia esperada |
| `/public/*` | 30 | 1 min | Usuarios nao autenticados |

### Headers de Rate Limit

Sempre retornar headers informativos:

```typescript
const headers = {
  'X-RateLimit-Limit': '100',      // Limite total
  'X-RateLimit-Remaining': '95',   // Restantes
  'X-RateLimit-Reset': '2026-02-02T15:30:00Z', // Quando reseta
  'Retry-After': '60',             // Segundos ate reset (se bloqueado)
};
```

### Cleanup de Rate Limit Logs

```sql
-- Limpar logs antigos de rate limiting (manter 1 dia)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_logs
  WHERE created_at < now() - interval '1 day';
END;
$$ LANGUAGE plpgsql;

-- Agendar
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *',  -- A cada hora
  'SELECT cleanup_rate_limit_logs()'
);
```

---

## Checklist de Audit e Rate Limiting

### Audit Logging

- [ ] Tabela `audit_logs` criada
- [ ] Triggers em tabelas criticas (users, subscriptions, etc.)
- [ ] Logs em Edge Functions para acoes importantes
- [ ] RLS: apenas admins leem logs
- [ ] Job de cleanup configurado (90 dias)
- [ ] Dashboard de audit no Admin Panel

### Rate Limiting

- [ ] Tabela `rate_limit_logs` criada (ou Redis configurado)
- [ ] Middleware em todas Edge Functions
- [ ] Limites definidos por tipo de endpoint
- [ ] Headers de rate limit retornados
- [ ] Mensagens de erro amigaveis (429)
- [ ] Job de cleanup configurado
- [ ] Monitoramento de rate limit violations

---

## Idempotencia

### Visao Geral

Idempotencia garante que uma operacao pode ser executada multiplas vezes sem efeitos colaterais indesejados. Essencial para:

- **Webhooks**: Stripe, pagamentos podem enviar o mesmo evento multiplas vezes
- **Retry de requisicoes**: Falhas de rede podem causar reenvios
- **Operacoes criticas**: Pagamentos, criacao de recursos, envio de emails

### Tabela de Idempotency Keys

```sql
-- Tabela para rastrear operacoes ja executadas
CREATE TABLE public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,          -- Chave unica da operacao
  resource_type TEXT NOT NULL,       -- 'payment', 'webhook', 'email', etc.
  resource_id TEXT,                  -- ID do recurso criado (se aplicavel)
  request_hash TEXT,                 -- Hash do payload (para validar duplicatas)
  response JSONB,                    -- Resposta armazenada para retornar em duplicatas
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

-- Indice para busca rapida
CREATE INDEX idx_idempotency_key ON idempotency_keys(key);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- Cleanup automatico de chaves expiradas
CREATE OR REPLACE FUNCTION cleanup_idempotency_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Agendar cleanup diario
SELECT cron.schedule(
  'cleanup-idempotency-keys',
  '0 4 * * *',  -- Todo dia as 4h
  'SELECT cleanup_idempotency_keys()'
);
```

### Webhook Handler Idempotente (Stripe)

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import crypto from 'node:crypto';

serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  // 1. Validar assinatura do Stripe
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createAdminClient();

  // 2. Verificar idempotencia usando event.id do Stripe
  const idempotencyKey = `stripe_${event.id}`;

  const { data: existingKey } = await supabase
    .from('idempotency_keys')
    .select('*')
    .eq('key', idempotencyKey)
    .single();

  if (existingKey) {
    // Evento ja processado - retornar resposta armazenada
    console.log(`Evento duplicado ignorado: ${event.id}`);
    return new Response(JSON.stringify(existingKey.response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Processar evento
  let result;
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        result = await handleCheckoutCompleted(supabase, session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        result = await handleSubscriptionUpdated(supabase, subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        result = await handlePaymentFailed(supabase, invoice);
        break;
      }
      default:
        result = { handled: false, reason: 'Event type not handled' };
    }
  } catch (err) {
    // Erro no processamento - NAO salvar idempotency key para permitir retry
    console.error(`Erro processando ${event.type}:`, err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }

  // 4. Salvar idempotency key APOS sucesso
  await supabase.from('idempotency_keys').insert({
    key: idempotencyKey,
    resource_type: 'stripe_webhook',
    resource_id: event.id,
    response: { received: true, result },
  });

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

### Edge Function Idempotente (Operacoes Criticas)

```typescript
// supabase/functions/create-subscription/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '../_shared/supabase.ts';
import crypto from 'node:crypto';

serve(async (req) => {
  // 1. Obter ou gerar idempotency key
  // Cliente pode enviar no header ou geramos baseado no payload
  let idempotencyKey = req.headers.get('Idempotency-Key');

  const body = await req.json();

  if (!idempotencyKey) {
    // Gerar key baseada no payload para detectar duplicatas automaticamente
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify({ userId: body.userId, planId: body.planId }))
      .digest('hex');
    idempotencyKey = `sub_${hash}`;
  }

  const supabase = createClient(req);

  // 2. Verificar se operacao ja foi executada
  const { data: existingKey } = await supabase
    .from('idempotency_keys')
    .select('*')
    .eq('key', idempotencyKey)
    .single();

  if (existingKey) {
    // Retornar resposta armazenada
    return new Response(JSON.stringify(existingKey.response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotent-Replay': 'true',
      },
    });
  }

  // 3. Executar operacao
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: body.userId,
      plan_id: body.planId,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  // 4. Salvar idempotency key
  await supabase.from('idempotency_keys').insert({
    key: idempotencyKey,
    resource_type: 'subscription',
    resource_id: subscription.id,
    request_hash: crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex'),
    response: subscription,
  });

  return new Response(JSON.stringify(subscription), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Hook de Idempotencia no Frontend

```typescript
// src/shared/hooks/useIdempotentMutation.ts
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

interface IdempotentMutationOptions<TData, TVariables> extends UseMutationOptions<TData, Error, TVariables> {
  generateKey?: (variables: TVariables) => string;
}

export function useIdempotentMutation<TData, TVariables>(
  mutationFn: (variables: TVariables, idempotencyKey: string) => Promise<TData>,
  options?: IdempotentMutationOptions<TData, TVariables>
) {
  return useMutation({
    ...options,
    mutationFn: async (variables: TVariables) => {
      // Gerar ou usar key customizada
      const key = options?.generateKey?.(variables) ?? uuidv4();
      return mutationFn(variables, key);
    },
  });
}

// Uso
const createSubscription = useIdempotentMutation(
  async (data, idempotencyKey) => {
    const response = await fetch('/functions/v1/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  {
    // Gerar key baseada nos dados para evitar duplicatas
    generateKey: (data) => `sub_${data.userId}_${data.planId}`,
  }
);
```

### Checklist de Idempotencia

- [ ] Tabela `idempotency_keys` criada
- [ ] Webhook handlers usam event.id como chave
- [ ] Edge Functions criticas aceitam `Idempotency-Key` header
- [ ] Idempotency key salva APOS sucesso (nao antes)
- [ ] Erros NAO salvam idempotency key (permite retry)
- [ ] Respostas duplicadas retornam header `X-Idempotent-Replay: true`
- [ ] Job de cleanup configurado (24h default)
- [ ] Operacoes de pagamento sao idempotentes

### Quando Usar Idempotencia

| Operacao | Idempotencia Necessaria | Motivo |
|----------|------------------------|--------|
| Webhooks (Stripe, etc.) | **OBRIGATORIO** | Provedores reenviam eventos |
| Criar assinatura/pagamento | **OBRIGATORIO** | Evita cobrar duas vezes |
| Enviar email | RECOMENDADO | Evita spam |
| Criar recurso unico | RECOMENDADO | Evita duplicatas |
| Atualizar recurso | OPCIONAL | UPDATE e naturalmente idempotente |
| Deletar recurso | OPCIONAL | DELETE e naturalmente idempotente |

---

## Sistema de Convite de Usuarios

### Visao Geral

Para projetos com multiplos usuarios/organizacoes, o sistema de convite permite adicionar membros por email. O fluxo e:

1. Admin/membro envia convite (insere apenas email)
2. Usuario recebe email com link de convite
3. Usuario clica no link e vai para pagina de aceitar convite
4. Usuario preenche: foto de perfil, nome, senha, confirmacao de senha
5. Usuario e adicionado a organizacao com role especificada

### Schema

```sql
-- Tabela de convites pendentes
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id),
  invited_by UUID REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(email, organization_id)
);

-- Indices
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_org ON invitations(organization_id);

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Membros podem ver convites da org
CREATE POLICY "members_view_org_invitations"
ON invitations FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Admins podem criar/deletar convites
CREATE POLICY "admins_manage_invitations"
ON invitations FOR ALL
TO authenticated
USING (
  user_can(auth.uid(), 'members', 'invite')
);
```

### Edge Function: Enviar Convite

```typescript
// supabase/functions/invite-member/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { email, organizationId, roleId } = await req.json();

  // Verificar se usuario atual pode convidar
  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  // Criar convite
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      email,
      organization_id: organizationId,
      role_id: roleId,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  // Enviar email de convite
  const inviteUrl = `${Deno.env.get('APP_URL')}/invite/accept?token=${invitation.token}`;

  // Usar Resend/SendGrid para enviar email
  await sendInvitationEmail({
    to: email,
    inviteUrl,
    organizationName: 'Nome da Org', // Buscar do banco
    invitedBy: user.email,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

### Pagina de Aceitar Convite

```tsx
// src/features/auth/pages/AcceptInvite.tsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { validatePassword } from '@/shared/lib/password-validation';
import { PasswordStrength } from '@/components/ui/password-strength';
import { AvatarUpload } from '@/components/ui/avatar-upload';

const acceptInviteSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  password: z.string().refine(
    (val) => validatePassword(val).valid,
    'Senha nao atende aos requisitos'
  ),
  confirmPassword: z.string(),
  avatarUrl: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas nao conferem',
  path: ['confirmPassword'],
});

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(acceptInviteSchema),
  });

  // Buscar dados do convite
  const { data: invitation, isLoading: loadingInvite } = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const { data } = await supabase
        .from('invitations')
        .select('*, organizations(name)')
        .eq('token', token)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();
      return data;
    },
    enabled: !!token,
  });

  const onSubmit = async (values) => {
    setIsLoading(true);

    // 1. Criar usuario no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          avatar_url: values.avatarUrl,
        },
      },
    });

    if (authError) {
      toast.error(authError.message);
      setIsLoading(false);
      return;
    }

    // 2. Aceitar convite (edge function atualiza invitation e adiciona a org)
    await supabase.functions.invoke('accept-invitation', {
      body: { token, userId: authData.user.id },
    });

    navigate('/app');
  };

  if (loadingInvite) return <LoadingSpinner />;

  if (!invitation) {
    return (
      <div className="text-center">
        <h1>Convite invalido ou expirado</h1>
        <p>Solicite um novo convite ao administrador.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Aceitar Convite</h1>
      <p className="text-muted-foreground mb-6">
        Voce foi convidado para {invitation.organizations?.name}
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Avatar Upload */}
        <div className="flex justify-center">
          <AvatarUpload
            value={form.watch('avatarUrl')}
            onChange={(url) => form.setValue('avatarUrl', url)}
          />
        </div>

        {/* Nome */}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Senha */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <PasswordStrength password={field.value || ''} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirmar Senha */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Criando conta...' : 'Aceitar convite'}
        </Button>
      </form>
    </div>
  );
}
```

### Edicao e Reenvio de Convites

O sistema deve permitir editar convites pendentes e reenviar convites expirados.

#### Edge Function: Atualizar Email do Convite

```typescript
// supabase/functions/update-invitation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { invitationId, newEmail } = await req.json();

  // Verificar se usuario atual pode gerenciar convites
  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  // Buscar convite existente
  const { data: invitation, error: fetchError } = await supabase
    .from('invitations')
    .select('*, organizations(name)')
    .eq('id', invitationId)
    .is('accepted_at', null)
    .single();

  if (fetchError || !invitation) {
    return new Response(JSON.stringify({ error: 'Convite nao encontrado' }), { status: 404 });
  }

  // Gerar novo token e resetar expiracao
  const newToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const newExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  // Atualizar convite
  const { data: updated, error: updateError } = await supabase
    .from('invitations')
    .update({
      email: newEmail,
      token: newToken,
      expires_at: newExpiration.toISOString(),
    })
    .eq('id', invitationId)
    .select()
    .single();

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 400 });
  }

  // Enviar novo email de convite
  const inviteUrl = `${Deno.env.get('APP_URL')}/invite/accept?token=${newToken}`;

  await sendInvitationEmail({
    to: newEmail,
    inviteUrl,
    organizationName: invitation.organizations?.name,
    invitedBy: user.email,
  });

  return new Response(JSON.stringify({ success: true, invitation: updated }), { status: 200 });
});
```

#### Edge Function: Reenviar Convite

```typescript
// supabase/functions/resend-invitation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { invitationId } = await req.json();

  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  // Buscar convite
  const { data: invitation, error: fetchError } = await supabase
    .from('invitations')
    .select('*, organizations(name)')
    .eq('id', invitationId)
    .is('accepted_at', null)
    .single();

  if (fetchError || !invitation) {
    return new Response(JSON.stringify({ error: 'Convite nao encontrado' }), { status: 404 });
  }

  // Gerar novo token e resetar expiracao
  const newToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const newExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Atualizar token e expiracao
  const { error: updateError } = await supabase
    .from('invitations')
    .update({
      token: newToken,
      expires_at: newExpiration.toISOString(),
    })
    .eq('id', invitationId);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 400 });
  }

  // Reenviar email
  const inviteUrl = `${Deno.env.get('APP_URL')}/invite/accept?token=${newToken}`;

  await sendInvitationEmail({
    to: invitation.email,
    inviteUrl,
    organizationName: invitation.organizations?.name,
    invitedBy: user.email,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

#### Componente de Gestao de Convites

```tsx
// src/features/members/components/InvitationList.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, Edit, RefreshCw, Trash2 } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  expires_at: string;
  created_at: string;
  roles: { name: string };
}

export function InvitationList({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();
  const [editingInvite, setEditingInvite] = useState<Invitation | null>(null);
  const [newEmail, setNewEmail] = useState('');

  // Buscar convites pendentes
  const { data: invitations, isLoading } = useQuery({
    queryKey: ['invitations', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('invitations')
        .select('*, roles(name)')
        .eq('organization_id', organizationId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });
      return data as Invitation[];
    },
  });

  // Mutation: Atualizar email
  const updateEmail = useMutation({
    mutationFn: async ({ invitationId, newEmail }: { invitationId: string; newEmail: string }) => {
      const { error } = await supabase.functions.invoke('update-invitation', {
        body: { invitationId, newEmail },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', organizationId] });
      setEditingInvite(null);
      setNewEmail('');
    },
  });

  // Mutation: Reenviar convite
  const resendInvite = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.functions.invoke('resend-invitation', {
        body: { invitationId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', organizationId] });
    },
  });

  // Mutation: Cancelar convite
  const cancelInvite = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', organizationId] });
    },
  });

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  if (isLoading) return <div>Carregando convites...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Convites Pendentes</h3>

      {invitations?.length === 0 && (
        <p className="text-muted-foreground">Nenhum convite pendente.</p>
      )}

      {invitations?.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{invite.email}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Role: {invite.roles?.name}</span>
                <span>•</span>
                <span>
                  Enviado {formatDistanceToNow(new Date(invite.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isExpired(invite.expires_at) ? (
              <Badge variant="destructive">Expirado</Badge>
            ) : (
              <Badge variant="secondary">Pendente</Badge>
            )}

            {/* Editar email */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingInvite(invite);
                setNewEmail(invite.email);
              }}
              title="Editar email"
            >
              <Edit className="h-4 w-4" />
            </Button>

            {/* Reenviar convite */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => resendInvite.mutate(invite.id)}
              disabled={resendInvite.isPending}
              title="Reenviar convite"
            >
              <RefreshCw className={`h-4 w-4 ${resendInvite.isPending ? 'animate-spin' : ''}`} />
            </Button>

            {/* Cancelar convite */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => cancelInvite.mutate(invite.id)}
              title="Cancelar convite"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      {/* Dialog para editar email */}
      <Dialog open={!!editingInvite} onOpenChange={() => setEditingInvite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Email do Convite</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              O convite sera reenviado automaticamente para o novo email.
            </p>
            <Input
              type="email"
              placeholder="novo@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingInvite(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (editingInvite) {
                    updateEmail.mutate({
                      invitationId: editingInvite.id,
                      newEmail,
                    });
                  }
                }}
                disabled={updateEmail.isPending || !newEmail}
              >
                {updateEmail.isPending ? 'Atualizando...' : 'Atualizar e Reenviar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### Checklist de Convites

- [ ] Tabela `invitations` criada
- [ ] Edge Function para enviar convite
- [ ] Edge Function para aceitar convite
- [ ] Edge Function para atualizar email do convite
- [ ] Edge Function para reenviar convite
- [ ] Pagina `/invite/accept` implementada
- [ ] Componente de gestao de convites (listar, editar, reenviar, cancelar)
- [ ] Template de email de convite estilizado
- [ ] Validacao de senha nos requisitos minimos
- [ ] Upload de avatar funcionando
- [ ] Convites expiram em 7 dias
- [ ] Usuario e adicionado a org com role correta

---

## RLS Patterns para Funcionalidades Padrao

### Notificacoes

```sql
-- ============================================
-- NOTIFICACOES
-- ============================================

-- notifications: usuario ve/gerencia apenas suas notificacoes
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_notifications"
ON notifications FOR ALL TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- notification_preferences: usuario ve/gerencia apenas suas preferencias
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_preferences"
ON notification_preferences FOR ALL TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- push_subscriptions: usuario ve/gerencia apenas suas subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_push_subscriptions"
ON push_subscriptions FOR ALL TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- notification_types: todos podem ler
ALTER TABLE notification_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_notification_types"
ON notification_types FOR SELECT TO authenticated
USING (true);

-- admins podem gerenciar tipos
CREATE POLICY "admins_manage_notification_types"
ON notification_types FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));
```

### AI Support Chat

```sql
-- ============================================
-- AI SUPPORT CHAT
-- ============================================

-- chat_sessions: usuario ve apenas suas sessoes
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_chat_sessions"
ON chat_sessions FOR ALL TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- Admins podem ver todas as sessoes (para analytics)
CREATE POLICY "admins_read_all_chat_sessions"
ON chat_sessions FOR SELECT TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'));

-- chat_messages: usuario ve apenas mensagens das suas sessoes
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_chat_messages"
ON chat_messages FOR SELECT TO authenticated
USING (
  session_id IN (SELECT id FROM chat_sessions WHERE user_id = (select auth.uid()))
);

-- Usuario pode inserir mensagens nas suas sessoes
CREATE POLICY "users_insert_own_chat_messages"
ON chat_messages FOR INSERT TO authenticated
WITH CHECK (
  session_id IN (SELECT id FROM chat_sessions WHERE user_id = (select auth.uid()))
);

-- Admins podem ler todas as mensagens
CREATE POLICY "admins_read_all_chat_messages"
ON chat_messages FOR SELECT TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'));

-- feature_requests: usuario ve apenas seus pedidos
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_feature_requests"
ON feature_requests FOR ALL TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- Admins podem ler e gerenciar todos os pedidos
CREATE POLICY "admins_manage_feature_requests"
ON feature_requests FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));

-- ai_assistant_config: todos podem ler, admins podem editar
ALTER TABLE ai_assistant_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_ai_config"
ON ai_assistant_config FOR SELECT TO authenticated
USING (true);

CREATE POLICY "admins_edit_ai_config"
ON ai_assistant_config FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));
```

### Barras Promocionais

```sql
-- ============================================
-- BARRAS PROMOCIONAIS
-- ============================================

-- promotional_bars: qualquer usuario pode ler barras ativas
ALTER TABLE promotional_bars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_active_bars"
ON promotional_bars FOR SELECT TO authenticated
USING (
  is_active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at > now())
);

-- Admins podem gerenciar todas as barras
CREATE POLICY "admins_manage_promotional_bars"
ON promotional_bars FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));

-- promotional_bar_dismissals: usuario gerencia apenas seus fechamentos
ALTER TABLE promotional_bar_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_bar_dismissals"
ON promotional_bar_dismissals FOR ALL TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));
```

### Admin Notifications

```sql
-- ============================================
-- ADMIN NOTIFICATIONS
-- ============================================

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

-- RLS: apenas admins podem ver e gerenciar
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_admin_notifications"
ON admin_notifications FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));
```

### Limites de Uso

```sql
-- ============================================
-- LIMITES DE USO
-- ============================================

-- plan_limits: todos podem ler (para saber os limites)
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_plan_limits"
ON plan_limits FOR SELECT TO authenticated
USING (true);

-- Admins podem gerenciar limites
CREATE POLICY "admins_manage_plan_limits"
ON plan_limits FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));

-- usage_tracking: usuario ve apenas seu uso
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_usage"
ON usage_tracking FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

-- Sistema (service_role) pode inserir/atualizar uso
-- (Feito via Edge Functions com service_role_key)
```

### Tabelas de Sistema (Idempotencia e Rate Limiting)

```sql
-- ============================================
-- IDEMPOTENCY KEYS
-- ============================================
-- Tabela de sistema usada por Edge Functions para garantir idempotencia
-- Acesso apenas via service_role (Edge Functions)

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados NAO podem acessar diretamente
-- INSERT/SELECT feito via service_role nas Edge Functions
CREATE POLICY "service_role_only_idempotency"
ON idempotency_keys FOR ALL TO authenticated
USING (false) WITH CHECK (false);

-- ============================================
-- RATE LIMIT LOGS
-- ============================================
-- Tabela de sistema para rate limiting
-- Acesso apenas via service_role (middleware)

ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados NAO podem acessar diretamente
CREATE POLICY "service_role_only_rate_limits"
ON rate_limit_logs FOR ALL TO authenticated
USING (false) WITH CHECK (false);
```

### Admin Roles (Sistema Hierarquico de Admin)

```sql
-- ============================================
-- ADMIN ROLES
-- ============================================
-- Sistema de roles do painel administrativo (diferente das roles de projeto)

-- admin_roles: todos podem ler (para saber os niveis de admin)
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_admin_roles"
ON admin_roles FOR SELECT TO authenticated
USING (true);

-- Apenas super_admin pode gerenciar roles de admin
CREATE POLICY "super_admin_manage_admin_roles"
ON admin_roles FOR ALL TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'admin_role') = 'super_admin'
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'admin_role') = 'super_admin'
);

-- user_admin_roles: usuario pode ver sua propria role de admin
ALTER TABLE user_admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_admin_role"
ON user_admin_roles FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

-- Super admin pode gerenciar todas as associacoes
CREATE POLICY "super_admin_manage_user_admin_roles"
ON user_admin_roles FOR ALL TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'admin_role') = 'super_admin'
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'admin_role') = 'super_admin'
);
```

### Aceite de Termos Legais

```sql
-- ============================================
-- ACEITE DE TERMOS LEGAIS
-- ============================================

-- user_legal_acceptances: usuario ve apenas seus aceites
ALTER TABLE user_legal_acceptances ENABLE ROW LEVEL SECURITY;

-- Usuario pode ler seus proprios aceites
CREATE POLICY "users_read_own_legal_acceptances"
ON user_legal_acceptances FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

-- Usuario pode inserir seu proprio aceite
CREATE POLICY "users_insert_own_acceptance"
ON user_legal_acceptances FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

-- Aceites sao IMUTAVEIS (sem UPDATE ou DELETE)
-- Historico completo preservado para auditoria

-- Admins podem ler todos os aceites (para auditoria)
CREATE POLICY "admins_read_all_legal_acceptances"
ON user_legal_acceptances FOR SELECT TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'));

-- legal_document_versions: todos podem ler, admins podem editar
ALTER TABLE legal_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_legal_versions"
ON legal_document_versions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "admins_manage_legal_versions"
ON legal_document_versions FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));
```

### Checklist de RLS - Funcionalidades Padrao

- [ ] `user_legal_acceptances` - Usuario ve apenas seus aceites, imutavel
- [ ] `legal_document_versions` - Todos leem, admins gerenciam
- [ ] `notifications` - Usuario ve apenas suas notificacoes
- [ ] `notification_preferences` - Usuario ve apenas suas preferencias
- [ ] `push_subscriptions` - Usuario ve apenas suas subscriptions
- [ ] `chat_sessions` - Usuario ve apenas suas sessoes, admins veem todas
- [ ] `chat_messages` - Usuario ve apenas mensagens das suas sessoes
- [ ] `feature_requests` - Usuario ve apenas seus pedidos, admins veem todos
- [ ] `ai_assistant_config` - Todos leem, admins editam
- [ ] `promotional_bars` - Todos leem barras ativas, admins gerenciam
- [ ] `promotional_bar_dismissals` - Usuario gerencia seus fechamentos
- [ ] `admin_notifications` - Apenas admins
- [ ] `plan_limits` - Todos leem, admins gerenciam
- [ ] `usage_tracking` - Usuario ve apenas seu uso
- [ ] `idempotency_keys` - Apenas service_role (Edge Functions)
- [ ] `rate_limit_logs` - Apenas service_role (middleware)
- [ ] `admin_roles` - Todos leem, super_admin gerencia
- [ ] `user_admin_roles` - Usuario ve propria role, super_admin gerencia
