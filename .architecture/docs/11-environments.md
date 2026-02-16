# Environments

## Visao Geral

O projeto utiliza dois ambientes principais com promocao automatica de codigo.

---

## Ambientes

| Ambiente | Branch | Proposito | URL |
|----------|--------|-----------|-----|
| **Develop** | `develop` | Testes, validacao | `projeto-develop.vercel.app` |
| **Production** | `main` | Usuarios finais | `projeto.vercel.app` ou dominio customizado |

---

## Fluxo de Codigo

```
Feature Branch
     │
     ▼ (PR + Review)
┌─────────┐
│ develop │ ──────> Deploy automatico em develop
└────┬────┘
     │
     ▼ (Merge quando pronto)
┌─────────┐
│  main   │ ──────> Deploy automatico em producao
└─────────┘
```

---

## Variaveis de Ambiente

### Estrutura

```
.env.local          # Local development (git ignored)
.env.development    # Defaults para develop
.env.production     # Defaults para producao
```

### Variaveis por Ambiente

#### Comum (Todos os Ambientes)

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx

# App
VITE_APP_NAME=MeuProjeto
```

#### Develop

```bash
# URLs
VITE_APP_URL=https://projeto-develop.vercel.app

# Feature flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=false

# Analytics (opcional em develop)
# VITE_GA_ID=

# Stripe (modo teste)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

#### Production

```bash
# URLs
VITE_APP_URL=https://projeto.com

# Feature flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_MOCK_DATA=false

# Analytics
VITE_GA_ID=G-XXXXXXXXXX

# Stripe (modo producao)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Sentry
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Variaveis Server-Side (Supabase Functions)

Configurar no Supabase Dashboard ou via CLI:

```bash
# Secrets (nunca expor no client)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
RESEND_API_KEY=re_xxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

---

## Configuracao Vercel

### Por Projeto

1. Acessar projeto no Vercel Dashboard
2. Settings > Environment Variables
3. Adicionar variaveis para cada environment

### Via CLI

```bash
# Adicionar variavel para producao
vercel env add VITE_APP_URL production

# Adicionar variavel para preview (develop)
vercel env add VITE_APP_URL preview

# Listar variaveis
vercel env ls

# Remover variavel
vercel env rm VITE_APP_URL production
```

### Variaveis Automaticas do Vercel

Disponiveis automaticamente:

| Variavel | Descricao |
|----------|-----------|
| `VERCEL` | `1` se rodando no Vercel |
| `VERCEL_ENV` | `production`, `preview`, ou `development` |
| `VERCEL_URL` | URL do deploy atual |
| `VERCEL_GIT_COMMIT_SHA` | SHA do commit |

---

## Configuracao Supabase

### Projetos Separados vs Branches

**Recomendado: Projetos Separados**

| Ambiente | Projeto Supabase |
|----------|------------------|
| Develop | `projeto-dev` |
| Production | `projeto-prod` |

Vantagens:
- Isolamento completo de dados
- Sem risco de afetar producao
- Limites de uso separados

### Configurar via CLI

```bash
# Linkar projeto de desenvolvimento
supabase link --project-ref <dev-project-ref>

# Aplicar migrations
supabase db push

# Mudar para producao
supabase link --project-ref <prod-project-ref>
supabase db push
```

### Secrets no Supabase

```bash
# Listar secrets
supabase secrets list

# Adicionar secret
supabase secrets set STRIPE_SECRET_KEY=sk_xxx

# Remover secret
supabase secrets unset STRIPE_SECRET_KEY
```

---

## Branches Git

### Estrutura

```
main                    # Producao (protegida)
├── develop             # Desenvolvimento (protegida)
│   ├── feature/xxx     # Features em desenvolvimento
│   ├── fix/xxx         # Bugfixes
│   └── chore/xxx       # Manutencao
```

### Regras de Branch

| Branch | Push Direto | Requer PR | Requer Review |
|--------|-------------|-----------|---------------|
| `main` | ❌ | ✅ | ✅ |
| `develop` | ❌ | ✅ | ✅ (agentes) |
| `feature/*` | ✅ | - | - |

### Configurar Protecao (GitHub)

```yaml
# .github/branch-protection.yml (exemplo)
branches:
  - name: main
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 1
      required_status_checks:
        strict: true
        contexts:
          - build
          - test
      enforce_admins: false

  - name: develop
    protection:
      required_status_checks:
        strict: true
        contexts:
          - build
          - test
```

---

## Deploy Automatico

### Vercel (Frontend)

Configurado automaticamente ao conectar repo:

| Evento | Acao |
|--------|------|
| Push para `develop` | Deploy em Preview |
| Push para `main` | Deploy em Production |
| PR aberto | Deploy de Preview |

### Supabase (Backend)

Via GitHub Actions:

```yaml
# .github/workflows/supabase-deploy.yml
name: Deploy Supabase

on:
  push:
    branches: [develop, main]
    paths:
      - 'supabase/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy to Develop
        if: github.ref == 'refs/heads/develop'
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_DEV_PROJECT_REF }}
          supabase db push
          supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROD_PROJECT_REF }}
          supabase db push
          supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## Promocao de Ambiente

### Develop → Production

```bash
# 1. Garantir que develop esta atualizado
git checkout develop
git pull origin develop

# 2. Rodar testes
npm run test
npm run build

# 3. Merge para main
git checkout main
git pull origin main
git merge develop --no-ff -m "chore: promote develop to production"
git push origin main

# 4. Deploy automatico sera triggered
```

### Rollback

```bash
# Encontrar ultimo commit estavel
git log --oneline main

# Reverter para commit especifico
git checkout main
git revert HEAD --no-commit
git commit -m "revert: rollback to <commit-sha>"
git push origin main

# Ou via Vercel Dashboard:
# Deployments > Selecionar deploy anterior > Promote to Production
```

---

## Checklist de Configuracao

### Novo Projeto

- [ ] Criar repo GitHub
- [ ] Configurar branch protection (main, develop)
- [ ] Criar projeto Vercel
- [ ] Conectar Vercel ao GitHub
- [ ] Criar projeto Supabase (dev)
- [ ] Criar projeto Supabase (prod)
- [ ] Configurar variaveis no Vercel (develop)
- [ ] Configurar variaveis no Vercel (production)
- [ ] Configurar secrets no Supabase (dev)
- [ ] Configurar secrets no Supabase (prod)
- [ ] Configurar GitHub Actions para Supabase

### Validacao

- [ ] Push para develop dispara deploy preview
- [ ] Push para main dispara deploy production
- [ ] Migrations aplicam corretamente
- [ ] Functions deployam corretamente
- [ ] Variaveis de ambiente acessiveis

---

## Troubleshooting

### Deploy nao dispara

1. Verificar conexao Vercel ↔ GitHub
2. Verificar se branch esta configurada
3. Verificar logs no Vercel Dashboard

### Variaveis nao funcionam

1. Verificar prefixo `VITE_` para variaveis client-side
2. Verificar se variavel existe no ambiente correto
3. Rebuild apos adicionar variavel

### Migration falha

1. Verificar SQL syntax
2. Verificar se migration ja foi aplicada
3. Usar `supabase db reset` em develop (NUNCA em prod)
