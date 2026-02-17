# Migrations e Banco de Dados

## Visao Geral

Este documento define os padroes para migrations de banco de dados usando Supabase, incluindo nomenclatura, estrutura, RLS e boas praticas.

---

## Estrutura de Pastas

```
supabase/
├── migrations/
│   ├── 20240101000000_create_users.sql
│   ├── 20240101000001_create_organizations.sql
│   ├── 20240101000002_create_rls_policies.sql
│   └── 20240102000000_add_user_preferences.sql
├── seed.sql
└── config.toml
DATABASE.md                                    # ← Fonte de verdade do schema (raiz do projeto)
```

---

## DATABASE.md - Fonte de Verdade

### Proposito

O arquivo `DATABASE.md` na **raiz do projeto** e a fonte de verdade sobre o estado atual do banco de dados. Ele evita que os agentes precisem analisar todas as migrations para entender a estrutura atual.

### Regra Critica

> **OBRIGATORIO**: Sempre que uma migration que altere a estrutura do banco for criada, o `DATABASE.md` DEVE ser atualizado imediatamente pelo Database Agent.

### Estrutura do DATABASE.md

```markdown
# Database Schema

> **Atualizado em**: YYYY-MM-DD HH:MM (apos migration YYYYMMDDHHMMSS_nome.sql)
> **Gerado por**: Database Agent

## Resumo

- **Tabelas**: N
- **Enums**: N
- **Functions**: N
- **Triggers**: N
- **Policies RLS**: N

---

## Enums

### user_role
| Valor | Descricao |
|-------|-----------|
| owner | Dono do workspace |
| admin | Administrador |
| member | Membro comum |

---

## Tabelas

### users

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| email | TEXT | NOT NULL | - | Email unico |
| name | TEXT | NOT NULL | - | Nome completo |
| avatar_url | TEXT | NULL | - | URL do avatar |
| created_at | TIMESTAMPTZ | NOT NULL | now() | Criacao |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | Atualizacao |

**Indices**: `idx_users_email` (email)
**RLS**: Habilitado
**Policies**:
- `users_select_own`: SELECT onde auth.uid() = id
- `users_update_own`: UPDATE onde auth.uid() = id

---

### workspaces

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| name | TEXT | NOT NULL | - | Nome |
| slug | TEXT | NOT NULL | - | Slug unico |
| owner_id | UUID | NOT NULL | - | FK → users.id |
| created_at | TIMESTAMPTZ | NOT NULL | now() | Criacao |

**Indices**: `idx_workspaces_slug` (slug), `idx_workspaces_owner` (owner_id)
**RLS**: Habilitado
**Policies**:
- `workspaces_select_member`: SELECT se is_workspace_member()
- `workspaces_insert_authenticated`: INSERT se auth.uid() = owner_id
- `workspaces_update_admin`: UPDATE se is_workspace_admin()

---

## Relacionamentos

```
users
  └── 1:N → workspaces (owner_id)
  └── N:M → workspaces via workspace_members

workspaces
  └── 1:N → workspace_members
  └── 1:N → tasks

workspace_members
  └── N:1 → workspaces
  └── N:1 → users

tasks
  └── N:1 → workspaces
  └── N:1 → users (assignee_id)
  └── N:1 → users (created_by)
```

---

## Functions

| Funcao | Retorno | Descricao |
|--------|---------|-----------|
| is_workspace_member(UUID) | BOOLEAN | Verifica se usuario e membro |
| is_workspace_admin(UUID) | BOOLEAN | Verifica se usuario e admin |
| handle_updated_at() | TRIGGER | Atualiza updated_at |
| handle_new_user() | TRIGGER | Cria user apos signup |

---

## Triggers

| Trigger | Tabela | Evento | Funcao |
|---------|--------|--------|--------|
| users_updated_at | users | BEFORE UPDATE | handle_updated_at() |
| on_auth_user_created | auth.users | AFTER INSERT | handle_new_user() |
```

### Quando Atualizar

| Tipo de Migration | Atualizar DATABASE.md? |
|-------------------|----------------------|
| CREATE TABLE | SIM |
| ALTER TABLE ADD COLUMN | SIM |
| ALTER TABLE DROP COLUMN | SIM |
| CREATE INDEX | SIM |
| CREATE/DROP POLICY | SIM |
| CREATE FUNCTION | SIM |
| CREATE TRIGGER | SIM |
| CREATE ENUM | SIM |
| INSERT/UPDATE/DELETE dados | NAO |
| Comentarios apenas | NAO |

### Beneficios

1. **Agentes nao precisam ler todas as migrations** - DATABASE.md e suficiente
2. **Validacao rapida** - Facil verificar se estrutura esta correta
3. **Onboarding** - Novos agentes entendem o schema rapidamente
4. **Documentacao viva** - Sempre atualizado com o banco real

---

## Nomenclatura

### Formato

```
YYYYMMDDHHMMSS_descricao_em_snake_case.sql
```

### Exemplos

| Nome | Descricao |
|------|-----------|
| `20240101000000_create_users.sql` | Criar tabela users |
| `20240101000001_create_organizations.sql` | Criar tabela organizations |
| `20240101000002_add_rls_policies.sql` | Adicionar RLS policies |
| `20240102000000_add_avatar_to_users.sql` | Adicionar coluna avatar |
| `20240103000000_create_user_preferences.sql` | Criar tabela preferences |

### Regras

- Timestamp preciso (YYYYMMDDHHMMSS)
- Descricao clara e concisa
- snake_case
- Verbo no infinitivo (create, add, remove, update)

---

## Template de Migration

### Criar Tabela

```sql
-- 20240101000000_create_users.sql
-- Cria tabela de usuarios com campos basicos

-- Tabela
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indices
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Comentarios
COMMENT ON TABLE public.users IS 'Tabela de usuarios do sistema';
COMMENT ON COLUMN public.users.email IS 'Email unico do usuario';
```

### Adicionar Coluna

```sql
-- 20240102000000_add_avatar_to_users.sql
-- Adiciona coluna de avatar aos usuarios

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.users.avatar_url IS 'URL do avatar do usuario';
```

### Criar Enum

```sql
-- 20240103000000_create_user_role_enum.sql
-- Cria enum de roles de usuario

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'member', 'viewer');
  END IF;
END
$$;
```

### Criar Funcao

```sql
-- 20240104000000_create_get_tenant_id_function.sql
-- Cria funcao para obter tenant_id do JWT

CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS TEXT AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::TEXT;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_tenant_id IS 'Retorna tenant_id do JWT atual';
```

---

## Idempotencia

### Idempotencia em Migrations (DDL)

| Comando | Alternativa Idempotente |
|---------|------------------------|
| `CREATE TABLE` | `CREATE TABLE IF NOT EXISTS` |
| `CREATE INDEX` | `CREATE INDEX IF NOT EXISTS` |
| `CREATE FUNCTION` | `CREATE OR REPLACE FUNCTION` |
| `CREATE TYPE` | `DO $$ ... IF NOT EXISTS ... $$` |
| `ALTER TABLE ADD COLUMN` | `ADD COLUMN IF NOT EXISTS` |

```sql
-- ERRADO: Falha se tabela existe
CREATE TABLE users (...);

-- CERTO: Idempotente
CREATE TABLE IF NOT EXISTS users (...);
```

### Idempotencia em Operacoes (DML)

Para operacoes criticas (webhooks, pagamentos, etc.), usar tabela de idempotency keys:

```sql
-- Tabela para rastrear operacoes ja executadas
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,          -- Chave unica da operacao
  resource_type TEXT NOT NULL,       -- 'payment', 'webhook', 'email', etc.
  resource_id TEXT,                  -- ID do recurso criado (se aplicavel)
  request_hash TEXT,                 -- Hash do payload
  response JSONB,                    -- Resposta armazenada
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_idempotency_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);
```

**Documentacao completa**: Ver `.architecture/docs/04-seguranca.md` > Secao "Idempotencia" para:
- Webhook handlers idempotentes
- Edge Functions com idempotency key
- Hook de frontend
- Checklist de implementacao

---

## RLS em Migrations

### Checklist

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] Policy de SELECT
- [ ] Policy de INSERT
- [ ] Policy de UPDATE
- [ ] Policy de DELETE (se aplicavel)
- [ ] Usar `TO authenticated` (nao deixar para anon)
- [ ] Usar `(select auth.uid())` para performance

### Template

```sql
-- Habilitar RLS
ALTER TABLE public.nome_tabela ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "nome_tabela_select"
  ON public.nome_tabela
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- INSERT
CREATE POLICY "nome_tabela_insert"
  ON public.nome_tabela
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- UPDATE
CREATE POLICY "nome_tabela_update"
  ON public.nome_tabela
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- DELETE
CREATE POLICY "nome_tabela_delete"
  ON public.nome_tabela
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));
```

---

## Seed Data

### supabase/seed.sql

```sql
-- seed.sql
-- Dados iniciais para desenvolvimento

-- Usuarios de teste
INSERT INTO public.users (id, email, full_name)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin User'),
  ('00000000-0000-0000-0000-000000000002', 'member@example.com', 'Member User')
ON CONFLICT (id) DO NOTHING;

-- Dados de exemplo
INSERT INTO public.organizations (id, name, owner_id)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'Acme Corp', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
```

### Rodar seed

```bash
# Local
supabase db reset  # Aplica migrations + seed

# Apenas seed (sem reset)
psql $DATABASE_URL -f supabase/seed.sql
```

---

## Comandos Supabase CLI

```bash
# Status do banco
supabase db status

# Criar nova migration
supabase migration new nome_da_migration

# Aplicar migrations localmente
supabase db reset

# Aplicar em producao
supabase db push

# Gerar diff (schema atual vs migrations)
supabase db diff --schema public

# Listar migrations
supabase migration list
```

---

## Rollback

### Estrategia

Supabase nao tem rollback automatico. Criar migrations de reverso quando necessario.

### Exemplo

```sql
-- 20240105000000_add_status_to_users.sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 20240105000001_rollback_add_status_to_users.sql
-- ROLLBACK: Remove coluna status de users
ALTER TABLE public.users
  DROP COLUMN IF EXISTS status;
```

### Boas praticas

- Testar migrations em staging antes de producao
- Backups antes de migrations destrutivas
- Migrations pequenas e incrementais
- Evitar `DROP` em producao (deprecar primeiro)

---

## Multi-Tenancy

### Padrao: Shared Tables + tenant_id

```sql
-- Tabela com tenant_id
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indice para queries por tenant
CREATE INDEX projects_tenant_id_idx ON public.projects(tenant_id);

-- RLS de isolamento
CREATE POLICY "tenant_isolation"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (tenant_id = (select public.get_tenant_id()))
  WITH CHECK (tenant_id = (select public.get_tenant_id()));
```

---

## Checklist de Migration

### Antes de criar

- [ ] Migration necessaria? (evitar alteracoes triviais)
- [ ] Nome descritivo e timestamp correto
- [ ] Testada localmente

### Conteudo

- [ ] Idempotente (IF NOT EXISTS, OR REPLACE)
- [ ] RLS habilitado e policies criadas
- [ ] Indices para queries frequentes
- [ ] Comentarios em tabelas/colunas importantes
- [ ] Sem dados sensiveis hardcoded

### Antes de push

- [ ] `supabase db reset` passa localmente
- [ ] Testada em staging (se disponivel)
- [ ] Backup realizado (producao)
- [ ] Comunicado ao time (se breaking change)

---

## Anti-Patterns

| Anti-Pattern | Problema | Solucao |
|-------------|----------|---------|
| `DROP TABLE` em producao | Perda de dados | Deprecar, migrar dados, depois remover |
| Migrations manuais | Inconsistencia entre ambientes | Sempre usar migrations versionadas |
| Secrets em seed.sql | Exposicao de credenciais | Usar variaveis de ambiente |
| RLS esquecido | Dados expostos | Checklist obrigatorio |
| Migrations gigantes | Dificil debug/rollback | Pequenas e incrementais |
