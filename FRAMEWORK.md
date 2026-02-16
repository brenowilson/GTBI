# Code Architecture Framework

Framework para geracao de projetos SaaS em "one shot" a partir de um PRD, otimizado para IA. Do briefing a producao, sem intervencao humana apos aprovacao do PRD.

---

## IMPORTANTE: Framework Privado

**A pasta `.architecture/` NAO deve ser commitada em projetos derivados.**

Ao iniciar um novo projeto usando este template:

1. O Meta-Orchestrator adiciona automaticamente `.architecture/` ao `.gitignore` na **Fase 0**
2. O framework permanece **apenas local** para uso do Claude Code
3. O repositorio do projeto fica **limpo**, sem expor a documentacao do framework

**Por que?**
- O framework e propriedade privada e nao deve ser exposto publicamente
- Projetos derivados devem conter apenas o codigo do produto
- A documentacao do framework e para uso interno da IA, nao para o repositorio final

**Se por algum motivo o `.gitignore` nao for atualizado automaticamente**, adicione manualmente:

```gitignore
# Framework (nao commitar)
.architecture/
FRAMEWORK.md
```

---

## Visao Geral

- Geracao autonoma de projetos completos
- Arquitetura Clean + Feature-Sliced Design
- 17 agentes especializados trabalhando em conjunto
- Notificacoes via Telegram em cada marco
- Deploy automatico em develop e producao
- Stack: React + Vite + TypeScript + Supabase + Vercel

## Como Funciona

```
┌─────────────────────────────────────────────────────────────────┐
│                        HUMANO FAZ                               │
│  • Preencher INPUT.md, BRAND.md e assets/                       │
│  • Aprovar PRD                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AGENTES FAZEM TUDO                          │
│  Fase 1: Frontend ──────────────────────> Telegram ✓            │
│  Fase 2: Backend ───────────────────────> Telegram ✓            │
│  Fase 3: Integracao ────────────────────> Telegram ✓            │
│  Fase 4: Landing + Termos + Privacidade > Telegram ✓            │
│  Final: Deploy Producao ────────────────> Telegram ✓            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        HUMANO FAZ                               │
│  • Testar produto final                                         │
│  • Configurar dominio customizado (opcional)                    │
└─────────────────────────────────────────────────────────────────┘
```

## Estrutura

```
/
├── CLAUDE.md                           # Configuracao Claude Code
├── INPUT.md                            # Briefing do projeto (humano preenche)
├── BRAND.md                            # Manual de marca (humano preenche)
├── PRD.md                              # PRD do projeto (gerado)
├── DATABASE.md                         # Schema atual do banco (gerado)
│
├── assets/                             # Assets visuais (humano fornece)
│   ├── logo.png
│   ├── logo-bg.png
│   └── og-image.png
│
├── docs/                               # Documentacao tecnica do projeto (gerado e mantido)
│   ├── api/                            # API Documentation (Swagger/OpenAPI)
│   │   ├── openapi.yaml
│   │   └── README.md
│   ├── features/                       # Documentacao por feature
│   │   ├── INDEX.md
│   │   └── [feature].md
│   └── help-center/                    # Central de Ajuda (user-facing)
│       ├── _meta.json
│       └── [categorias]/
│
├── changelog/                          # Historico de mudancas (gerado e mantido)
│   ├── CHANGELOG.md
│   └── releases/
│
├── sessions/                           # Sessions do PROJETO (gerado)
│   ├── INDEX.md
│   └── session-*.md
│
├── generated/                          # Arquivos para setup manual (gerado)
│   ├── admin-setup.sql
│   ├── email-templates/
│   └── README.md
│
├── .architecture/                      # Docs do FRAMEWORK (gitignored)
│   ├── docs/                           # Documentacao tecnica do framework
│   ├── agents/                         # Definicao dos 17 agentes
│   ├── examples/                       # Exemplos de INPUT e BRAND
│   └── sessions/                       # Sessions do FRAMEWORK (historico)
├── src/                                # Codigo frontend (gerado)
└── supabase/                           # Backend (gerado)
```

**Nota**: A pasta `.architecture/` contem a documentacao do framework e e adicionada ao `.gitignore` quando o projeto inicia. Isso mantem seu repositorio limpo.

## Quick Start

### 1. Setup inicial (uma vez)

Ver `.architecture/docs/12-checklist-humano.md` para configurar:
- Contas (GitHub, Vercel, Supabase, Telegram Bot)
- Tokens e secrets
- Projeto base

### 2. Novo projeto

```bash
# Criar repo a partir do template
gh repo create meu-projeto --template brenowilson/code-architecture --public --clone
cd meu-projeto

# Copiar exemplos como base
cp .architecture/examples/INPUT-taskflow.md INPUT.md
cp .architecture/examples/BRAND.md BRAND.md
# Editar INPUT.md e BRAND.md com dados do seu projeto
# Adicionar assets/ com logo.png, logo-bg.png, og-image.png

# Gerar PRD
claude "Gere PRD a partir de INPUT.md"

# Revisar e aprovar PRD
# (responder perguntas do agente)

# Executar projeto completo
claude "Inicie projeto a partir do PRD.md aprovado"

# Aguardar notificacoes no Telegram...
# Projeto pronto em producao!
```

## Agentes

### Fluxo Principal

| Agente | Funcao | Invocacao |
|--------|--------|-----------|
| **PRD Generator** | Briefing → PRD estruturado | `claude "Gere PRD: ..."` |
| **Meta-Orchestrator** | Coordena todo o fluxo | `claude "Inicie projeto"` |

### Especializados (chamados pelo Orchestrator)

| Agente | Funcao |
|--------|--------|
| **Design System Generator** | Brand manual → design tokens |
| **Frontend Agent** | UI completa (pages, components, hooks) |
| **Database Agent** | Migrations, RLS, multi-tenancy, DATABASE.md |
| **Code Executor** | Executa fases do PRD, gera codigo |
| **Integration Agent** | Conecta front↔back, pagamentos, emails |
| **Landing Page Agent** | Landing + SEO + performance (apenas projetos publicos) |
| **Legal Generator** | Termos de uso + Privacidade (LGPD) |
| **Help Center Generator** | Central de ajuda user-friendly |
| **Admin Panel Agent** | Painel admin adaptavel ao PRD |
| **Notification Agent** | Sistema de notificacoes do PRODUTO (sininho, email, push) |
| **AI Support Agent** | Chat flutuante de IA para suporte ao usuario |
| **Test Generator** | Unit, integration, E2E |
| **Code Reviewer** | Maker-checker (score >= 0.8) |
| **Deploy Agent** | Vercel + Supabase + health check |
| **Ops Telegram Agent** | Notificacoes Telegram sobre DESENVOLVIMENTO |

## Fases do Projeto

| Fase | Conteudo | Notificacao | Condicao |
|------|----------|-------------|----------|
| 0 | Setup (design system, estrutura) | - | Sempre |
| 1 | Frontend completo | Link develop | Sempre |
| 2 | Backend completo | Link GitHub | Sempre |
| 3 | Integracao front + back | Link develop | Sempre |
| 4 | Site Publico (landing, termos, privacidade) + Admin Panel | Link develop | Publico: landing + legal; Privado: apenas Admin Panel |
| Final | Deploy producao | Link producao | Sempre |

## Documentacao

| Documento | Conteudo |
|-----------|----------|
| [CLAUDE.md](CLAUDE.md) | Stack, convencoes, comandos |
| [.architecture/docs/13-invocacao-agentes.md](.architecture/docs/13-invocacao-agentes.md) | Como invocar cada agente |
| [.architecture/docs/01-arquitetura.md](.architecture/docs/01-arquitetura.md) | Clean + FSD |
| [.architecture/docs/14-responsividade-mobile.md](.architecture/docs/14-responsividade-mobile.md) | Mobile-first, breakpoints |
| [.architecture/docs/15-pwa.md](.architecture/docs/15-pwa.md) | PWA instalavel |
| [.architecture/docs/12-checklist-humano.md](.architecture/docs/12-checklist-humano.md) | O que humano faz |
| [.architecture/docs/11-environments.md](.architecture/docs/11-environments.md) | Develop vs Production |
| [.architecture/examples/](.architecture/examples/) | Exemplos preenchidos de INPUT e BRAND |

## Stack

- **Frontend**: React 19 + Vite + TypeScript + shadcn/ui
- **PWA**: vite-plugin-pwa + Workbox (instalavel, offline)
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Deploy**: Vercel + Supabase Cloud
- **Testes**: Vitest + Playwright
- **CI/CD**: GitHub Actions
- **Notificacoes**: Telegram Bot API

## Licenca

MIT
