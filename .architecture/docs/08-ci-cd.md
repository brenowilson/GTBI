# CI/CD & Workflows

## Visao Geral

Este framework utiliza **GitHub Actions** para CI/CD completo, integrando validacao, deploy no Supabase e deploy na Vercel.

---

## Arquitetura de Workflows

```
┌─────────────────────────────────────────────────────────┐
│                    Push / Pull Request                  │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                      CI (Validacao)                     │
│  - Lint / Type-check / Testes / Build / Security Audit │
└────────────────────────────┬────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   Deploy Supabase       │   │    Deploy Vercel        │
│   - Migrations          │   │    - Preview / Prod     │
│   - Edge Functions      │   │                         │
└─────────────────────────┘   └─────────────────────────┘
```

---

## Workflow Principal

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Validate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: true

      - name: Build
        run: npm run build

      - name: Security audit
        run: npm audit --audit-level=high
```

---

## Deploy Supabase

### .github/workflows/deploy-supabase.yml

```yaml
name: Deploy Supabase

on:
  push:
    branches: [main]
    paths:
      - 'supabase/**'
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Supabase
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link project
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Push database changes
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deploy Edge Functions
        run: supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Secrets Necessarios (Supabase)

| Secret | Descricao | Onde obter |
|--------|-----------|------------|
| `SUPABASE_ACCESS_TOKEN` | Token de acesso pessoal | supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_REF` | ID do projeto | URL do dashboard (ex: abcdefghijklmnop) |

---

## Deploy Vercel

### .github/workflows/deploy-vercel.yml

```yaml
name: Deploy Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy-preview:
    name: Deploy Preview
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    environment:
      name: preview
      url: ${{ steps.deploy.outputs.url }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Preview
        id: deploy
        run: |
          url=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "url=$url" >> $GITHUB_OUTPUT

      - name: Comment PR with URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed: ${{ steps.deploy.outputs.url }}'
            })

  deploy-production:
    name: Deploy Production
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://your-app.vercel.app

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Production
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Secrets Necessarios (Vercel)

| Secret | Descricao | Onde obter |
|--------|-----------|------------|
| `VERCEL_TOKEN` | Token de acesso | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | ID da organizacao | vercel.com/[org]/settings |
| `VERCEL_PROJECT_ID` | ID do projeto | vercel.com/[org]/[project]/settings |

---

## Workflow Full Stack

### .github/workflows/full-stack-deploy.yml

```yaml
name: Full Stack Deployment

on:
  push:
    branches: [main]

jobs:
  ci:
    name: CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build

  deploy-supabase:
    name: Deploy Supabase
    needs: ci
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - name: Deploy
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase db push
          supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  deploy-vercel:
    name: Deploy Vercel
    needs: ci
    runs-on: ubuntu-latest
    environment: production
    env:
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g vercel@latest
      - run: |
          vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
          vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
          vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Branch Strategy

### Estrutura

```
main (production)
  ↑
develop (staging)
  ↑
feat/*, fix/* (feature branches)
```

### Regras

| Branch | Trigger | Deploy |
|--------|---------|--------|
| `main` | push | Production (Vercel + Supabase) |
| `develop` | push | Staging (Vercel preview) |
| `feat/*`, `fix/*` | PR | Preview (Vercel) |

### Branch Protection (main)

```yaml
# Configurar em Settings > Branches > Add rule

Branch name pattern: main

Rules:
  - [x] Require a pull request before merging
    - [x] Require approvals: 1
    - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require status checks to pass before merging
    - [x] Require branches to be up to date before merging
    - Status checks: ci
  - [x] Require conversation resolution before merging
  - [ ] Require signed commits (opcional)
  - [x] Do not allow bypassing the above settings
```

---

## Workflow de Security Audit

### .github/workflows/security.yml

```yaml
name: Security Audit

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0' # Domingo a meia-noite

jobs:
  audit:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: NPM Audit
        run: npm audit --audit-level=high

      - name: Supabase RLS Audit
        run: |
          npm install -g supashield
          supashield audit --fail-on-critical
        continue-on-error: true

      - name: Check for secrets in code
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

---

## Ambientes

### GitHub Environments

| Environment | URL | Secrets |
|-------------|-----|---------|
| `preview` | Dynamic (PR) | VERCEL_* |
| `staging` | staging.app.com | VERCEL_*, SUPABASE_STAGING_* |
| `production` | app.com | VERCEL_*, SUPABASE_* |

### Configurar Environments

1. Settings > Environments > New environment
2. Adicionar protection rules:
   - Required reviewers (para production)
   - Wait timer (opcional)
3. Adicionar secrets especificos do ambiente

---

## Scripts package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "prepare": "husky install"
  }
}
```

---

## Pre-commit Hooks (Husky)

### .husky/pre-commit

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### .lintstagedrc

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

---

## Checklist de Setup

### GitHub

- [ ] Criar secrets em Settings > Secrets and variables > Actions
- [ ] Configurar branch protection em Settings > Branches
- [ ] Criar environments (preview, staging, production)

### Vercel

- [ ] Criar projeto e obter IDs
- [ ] Gerar access token
- [ ] Configurar environment variables

### Supabase

- [ ] Gerar access token
- [ ] Obter project ref
- [ ] Configurar linked project local

### Local

- [ ] Instalar husky: `npm run prepare`
- [ ] Testar workflows: `act` (opcional)
