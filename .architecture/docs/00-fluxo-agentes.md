# Orquestracao de Agentes

## Visao Geral

Este documento define a orquestracao dos **17 agentes** do framework para geracao de projetos SaaS em one-shot, do PRD ate producao.

---

## ESTRUTURA DO PROJETO (CRITICO - NUNCA IGNORAR)

Esta secao define a estrutura organizacional do framework. **TODOS os agentes e documentos devem seguir esta estrutura.**

### Responsabilidades por Pasta

```
.architecture/
├── docs/           → Especificacoes tecnicas, padroes, regras, SQL schemas, component patterns
│   ├── 00-fluxo-agentes.md       → Orquestracao dos agentes
│   ├── 01-arquitetura.md         → Clean Architecture + Feature-Sliced Design
│   ├── 04-seguranca.md           → OWASP, RLS, RBAC
│   ├── 07-sessoes.md             → Sessions do projeto (separadas do framework)
│   ├── 16-admin-panel.md         → Padroes do Admin Panel
│   ├── 17-ai-support.md          → Padroes do AI Support Chat
│   ├── 18-notifications.md       → Padroes do Sistema de Notificacoes
│   ├── 19-usage-limits.md        → Padroes de Limites de Uso
│   ├── 20-promotional-bars.md    → Padroes de Barras Promocionais
│   └── 21-documentacao-viva.md   → Sistema de documentacao mantida automaticamente
├── agents/         → Instrucoes de execucao ENXUTAS (inputs, outputs, validacao)
└── examples/       → Exemplos de uso (INPUT, BRAND preenchidos)
```

### O que vai em cada lugar

| Pasta | Contem | NAO Contem |
|-------|--------|------------|
| **docs/** | Padroes de arquitetura, regras de seguranca (RLS), schemas SQL, component patterns, especificacoes de funcionalidades padrao | Instrucoes de execucao especificas de agentes |
| **agents/** | Instrucoes de execucao ENXUTAS, quando invocar, inputs necessarios, outputs esperados, como validar, referencias a docs | Codigo SQL completo, componentes React completos (esses ficam em docs/) |
| **examples/** | Exemplos preenchidos de INPUT, BRAND, PRD | Codigo executavel |

### Formato Padrao de Agent

Todo agent DEVE seguir este formato enxuto:

```markdown
# Agente: [Nome]

## Identidade
[1-2 linhas sobre o que e o agente]

## Objetivo
[Lista curta de 3-5 itens do que o agente gera]

## Quando Sou Invocado
[Quem invoca e em qual fase/contexto]

## Inputs Necessarios
[Lista de arquivos/dados que precisa receber]
- Referencia: `docs/[arquivo].md`

## O Que Gero
[Lista de outputs com paths]

## Como Validar
[Criterios de sucesso]

## Referencias
[Links para docs relevantes e outros agents]
```

### Tipos de Agents

| Tipo | Proposito | Exemplo |
|------|-----------|---------|
| **Geracao** | Criam codigo/conteudo do produto | Frontend Agent, Database Agent |
| **Qualidade** | Validam outputs | Code Reviewer, Test Generator |
| **Operacional** | Comunicacao/deploy do desenvolvimento | Ops Telegram Agent, Deploy Agent |
| **Coordenacao** | Orquestram outros agents | Meta-Orchestrator |

### Operacional vs Funcionalidade

**CRITICO**: Distinguir claramente:

| Tipo | Descricao | Exemplo |
|------|-----------|---------|
| **Operacional** | Comunicacao sobre o DESENVOLVIMENTO do projeto | Notificacao Telegram sobre fases concluidas |
| **Funcionalidade** | Feature do PRODUTO para usuarios finais | Sistema de notificacoes para usuarios (sininho, email, push) |

Agents operacionais tem prefixo `ops-` no nome do arquivo.

---

## Agentes do Framework

### Tabela Completa (17 Agentes)

| # | Agente | Tipo | Responsabilidade | Arquivo |
|---|--------|------|------------------|---------|
| 1 | **PRD Generator** | Entrada | Transforma briefing em PRD estruturado | [`prd-generator.md`](../agents/prd-generator.md) |
| 2 | **Meta-Orchestrator** | Coordenacao | Coordena todo o fluxo PRD → Producao | [`meta-orchestrator.md`](../agents/meta-orchestrator.md) |
| 3 | **Design System Generator** | Geracao | Brand manual → Design tokens | [`design-system-generator.md`](../agents/design-system-generator.md) |
| 4 | **Frontend Agent** | Geracao | UI completa (pages, components, hooks) | [`frontend-agent.md`](../agents/frontend-agent.md) |
| 5 | **Database Agent** | Geracao | Migrations, RLS, schemas multi-tenant | [`database-agent.md`](../agents/database-agent.md) |
| 6 | **Code Executor** | Geracao | Executa fases do PRD, gera codigo | [`code-executor.md`](../agents/code-executor.md) |
| 7 | **Integration Agent** | Geracao | Conecta front↔back, integracoes externas | [`integration-agent.md`](../agents/integration-agent.md) |
| 8 | **Landing Page Agent** | Geracao | Landing + SEO + performance | [`landing-page-agent.md`](../agents/landing-page-agent.md) |
| 9 | **Legal Generator** | Geracao | Termos de uso + Privacidade (LGPD) | [`legal-generator.md`](../agents/legal-generator.md) |
| 10 | **Help Center Generator** | Geracao | Central de Ajuda user-friendly | [`help-center-generator.md`](../agents/help-center-generator.md) |
| 11 | **Admin Panel Agent** | Geracao | Painel administrativo e backoffice | [`admin-panel-agent.md`](../agents/admin-panel-agent.md) |
| 12 | **Notification Agent** | Geracao | Sistema de notificacoes do PRODUTO (sininho, email, push) | [`notification-agent.md`](../agents/notification-agent.md) |
| 13 | **AI Support Agent** | Geracao | Chat flutuante de IA para suporte | [`ai-support-agent.md`](../agents/ai-support-agent.md) |
| 14 | **Test Generator** | Qualidade | Testes unit, integration, E2E | [`test-generator.md`](../agents/test-generator.md) |
| 15 | **Code Reviewer** | Qualidade | Maker-checker, valida qualidade | [`code-reviewer.md`](../agents/code-reviewer.md) |
| 16 | **Deploy Agent** | Operacional | Vercel + Supabase + health check | [`deploy-agent.md`](../agents/deploy-agent.md) |
| 17 | **Ops Telegram Agent** | Operacional | Notificacao Telegram sobre DESENVOLVIMENTO | [`ops-telegram-agent.md`](../agents/ops-telegram-agent.md) |

### Categorias

| Categoria | Agentes |
|-----------|---------|
| **Entrada** | PRD Generator |
| **Coordenacao** | Meta-Orchestrator |
| **Geracao** | Design System Generator, Frontend Agent, Database Agent, Code Executor, Integration Agent, Landing Page Agent, Legal Generator, Help Center Generator, Admin Panel Agent, Notification Agent, AI Support Agent |
| **Qualidade** | Test Generator, Code Reviewer |
| **Operacional** | Deploy Agent, Ops Telegram Agent |

**Nota**: Notification Agent e AI Support Agent sao funcionalidades do PRODUTO. Ops Telegram Agent e operacional do DESENVOLVIMENTO.

---

## Fluxo Completo

### Diagrama Geral

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USUARIO                                     │
│         Preenche INPUT.md + BRAND.md → Aprova PRD                       │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRD GENERATOR                                   │
│              Transforma briefing em PRD estruturado                     │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼ PRD.md aprovado
┌─────────────────────────────────────────────────────────────────────────┐
│                        META-ORCHESTRATOR                                 │
│          Coordena todo o fluxo de forma autonoma                        │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│ FASE 0: Setup │         │ FASE 1:       │         │ FASE 2:       │
│               │         │ Frontend      │         │ Backend       │
│ Design System │         │               │         │               │
│ Generator     │         │ Frontend      │         │ Database      │
│               │         │ Agent         │         │ Agent         │
│               │         │               │         │               │
│               │         │ Test          │         │ Code          │
│               │         │ Generator     │         │ Executor      │
│               │         │               │         │               │
│               │         │ Code          │         │ Test          │
│               │         │ Reviewer      │         │ Generator     │
│               │         │               │         │               │
│               │         │ Deploy        │         │ Code          │
│               │         │ Agent         │         │ Reviewer      │
│               │         │               │         │               │
│               │         │ Notification  │         │ Deploy        │
│               │         │ Agent ────────┼────────>│ Agent         │
└───────────────┘         └───────┬───────┘         │               │
                                  │                 │ Notification  │
                                  │                 │ Agent ────────┼──>
                                  │                 └───────┬───────┘
        ┌─────────────────────────┴─────────────────────────┘
        │
        ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│ FASE 3:       │         │ FASE 4:       │         │ FINAL:        │
│ Integracao    │         │ Site Publico  │         │ Producao      │
│               │         │               │         │               │
│ Integration   │         │ Landing Page  │         │ Deploy        │
│ Agent         │         │ Agent         │         │ Agent         │
│               │         │               │         │ (main)        │
│ Test          │         │ Legal         │         │               │
│ Generator     │         │ Generator     │         │ Health        │
│ (E2E)         │         │               │         │ Check         │
│               │         │ Code          │         │               │
│ Code          │         │ Reviewer      │         │ Notification  │
│ Reviewer      │         │               │         │ Agent         │
│               │         │ Deploy        │         │ (Final)       │
│ Deploy        │         │ Agent         │         │               │
│ Agent         │         │               │         └───────────────┘
│               │         │ Notification  │
│ Notification  │         │ Agent ────────┼──>
│ Agent ────────┼──>      └───────────────┘
└───────────────┘
```

### Fases do Projeto

| Fase | Nome | Agentes Envolvidos | Notificacao |
|------|------|--------------------| ------------|
| 0 | Setup | Design System Generator | - |
| 1 | Frontend | Frontend Agent, Test Generator, Code Reviewer, Deploy Agent, Ops Telegram Agent | Telegram (link develop) |
| 2 | Backend | Database Agent, Code Executor, Notification Agent*, Test Generator, Code Reviewer, Deploy Agent, Ops Telegram Agent | Telegram (link GitHub) |
| 3 | Integracao | Integration Agent, Test Generator (E2E), Code Reviewer, Deploy Agent, Ops Telegram Agent | Telegram (link develop) |
| 4 | Site Publico | Landing Page Agent, Legal Generator, Help Center Generator, Admin Panel Agent, AI Support Agent*, Code Reviewer, Deploy Agent, Ops Telegram Agent | Telegram (link develop) |
| Final | Producao | Deploy Agent (main), Ops Telegram Agent | Telegram (link producao) |

*\* Notification Agent e AI Support Agent sao condicionais - invocados apenas se habilitados no INPUT.md (Secao 15).*

---

## Padroes de Orquestracao

### 1. Hierarchical Orchestration (Principal)

O Meta-Orchestrator coordena todos os outros agentes:

```
                    ┌─────────────────────┐
                    │  Meta-Orchestrator  │
                    │  (CTO AI)           │
                    └──────────┬──────────┘
                               │
       ┌───────────┬───────────┼───────────┬───────────┐
       │           │           │           │           │
       ▼           ▼           ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Frontend │ │ Database │ │Integration│ │ Landing  │ │  Deploy  │
│  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### 2. Maker-Checker (Qualidade)

Para cada output gerado:

```
┌─────────────┐         ┌─────────────┐
│   Maker     │ ──────> │   Checker   │
│ (qualquer   │         │   (Code     │
│  agente)    │ <────── │  Reviewer)  │
└─────────────┘         └─────────────┘
       │                       │
       │    score >= 0.8?      │
       │         │             │
       │    ┌────┴────┐        │
       │    │   Sim   │ ───────┘ Continua
       │    │   Nao   │ ─── Feedback ──> Corrigir
       │    └─────────┘
       │
       └───────────────────────────────────┐
                                           │
                                           ▼
                                      [Retry max 3x]
```

### 3. Sequential por Fase

Dentro de cada fase, a ordem e:

```
Gerar → Testar → Revisar → Commitar → Deployar → Verificar → Notificar
```

### 4. Self-Healing (Auto-Correcao)

```
Erro Detectado
     │
     ▼
┌─────────────────┐
│ Analisar Erro   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Gerar Correcao  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Aplicar Fix     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retry (max 3x)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Sucesso │ ──> Continuar
    │  Falha  │ ──> Notificar erro critico
    └─────────┘
```

### 5. Regras de Bloqueio (CRITICO)

O fluxo PARA completamente nas seguintes situacoes:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REGRAS DE BLOQUEIO                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ⛔ TESTES FALHANDO                                                      │
│     └── NAO pode: commit, push, deploy, avancar fase                    │
│     └── DEVE: corrigir testes, re-executar                              │
│                                                                         │
│  ⛔ CODE REVIEW < 0.8                                                     │
│     └── NAO pode: commit, push, deploy, avancar fase                    │
│     └── DEVE: corrigir issues, re-submeter review                       │
│                                                                         │
│  ⛔ ISSUES CRITICAL NO REVIEW                                            │
│     └── NAO pode: NADA (bloqueio absoluto)                              │
│     └── DEVE: corrigir issues criticas primeiro                         │
│                                                                         │
│  ⛔ HEALTH CHECK FALHOU                                                  │
│     └── NAO pode: avancar fase, notificar sucesso                       │
│     └── DEVE: rollback, analisar, corrigir, re-deployar                 │
│                                                                         │
│  ⛔ PRE-REQUISITOS AUSENTES                                              │
│     └── NAO pode: iniciar projeto                                       │
│     └── DEVE: completar checklist humano                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Fluxo com Bloqueios

```
Generate ──> Test ──> Review ──> Commit ──> Deploy ──> Health ──> Notify
    │          │         │          │         │          │
    ▼          ▼         ▼          ▼         ▼          ▼
  [OK?]      [OK?]     [OK?]      [OK?]     [OK?]      [OK?]
    │          │         │          │         │          │
   Yes        Yes       Yes        Yes       Yes        Yes
    │          │         │          │         │          │
   No ──> Fix No ──> Fix No ──> Fix          No ──> Fix │
    │    ▲     │    ▲     │    ▲              │    ▲    │
    └────┘     └────┘     └────┘              └────┘    │
   (retry)   (retry)   (retry)              (rollback) │
                                                       ▼
                                                   [Sucesso]
```

---

## Comunicacao entre Agentes

### Formato de Mensagem

```typescript
interface AgentMessage {
  from: AgentType;
  to: AgentType;
  type: 'task' | 'result' | 'feedback' | 'approval' | 'error' | 'context';
  payload: {
    taskId: string;
    phase: number;
    content: string;
    artifacts?: string[];
    score?: number;
    error?: string;
    context?: AgentContext; // NOVO: contexto compartilhado
  };
  timestamp: string;
}

interface AgentContext {
  databaseSchema?: string;      // Conteudo do DATABASE.md
  edgeFunctions?: string[];     // Lista de endpoints disponiveis
  designTokens?: string;        // Tokens do Design System
  integrations?: string[];      // Integracoes externas do PRD
}
```

---

## Handoffs entre Agentes (CRITICO)

### Fluxo de Contexto

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE CONTEXTO                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BRAND.md ──────────────> Design System Generator                       │
│                                  │                                      │
│                                  ▼                                      │
│                           Design Tokens ──────────> Frontend Agent      │
│                                                           │             │
│  PRD.md ────────────────────────────────────────────────>│             │
│                                                           │             │
│  DATABASE.md ────────────────────────────────────────────>│             │
│       ▲                                                   │             │
│       │                                                   │             │
│  Database Agent                                           │             │
│       │                                                   │             │
│       └─────── Atualiza DATABASE.md ◄─────────────────────┘             │
│                                                                         │
│  DATABASE.md ──────────────> Integration Agent                          │
│  Edge Functions List ──────>      │                                     │
│  PRD (integracoes) ──────────────>│                                     │
│                                   │                                     │
│                                   ▼                                     │
│                            API Client + Hooks Conectados                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tabela de Handoffs

| De | Para | O que passar | Quando |
|----|------|--------------|--------|
| Design System Generator | Frontend Agent | Tokens CSS, Tailwind config | Apos Fase 0 |
| Database Agent | DATABASE.md | Schema atualizado | Apos cada migration |
| DATABASE.md | Frontend Agent | Tipos para DTOs | Inicio Fase 1 |
| DATABASE.md | Code Executor | Schema para Edge Functions | Inicio Fase 2 |
| Code Executor | Integration Agent | Lista de Edge Functions | Inicio Fase 3 |
| DATABASE.md | Integration Agent | Schema para tipos | Inicio Fase 3 |
| PRD.md | Integration Agent | Integracoes externas | Inicio Fase 3 |
| DATABASE.md | Legal Generator | Dados coletados | Inicio Fase 4 |

### Regras de Handoff

1. **DATABASE.md e fonte de verdade**
   - Qualquer agente que precise saber do schema, consulta DATABASE.md
   - Database Agent DEVE atualizar DATABASE.md apos cada migration

2. **Integration Agent precisa de contexto completo**
   - NAO chamar Integration Agent sem passar:
     * DATABASE.md
     * Lista de Edge Functions
     * Integracoes externas do PRD

3. **Frontend Agent pode antecipar tipos**
   - Se DATABASE.md nao existir ainda, criar tipos baseados no PRD
   - Ajustar na Fase 3 quando integracao acontecer

### Exemplo de Fluxo (Fase 1)

```
1. Meta-Orchestrator -> Frontend Agent: {
     type: 'task',
     payload: { phase: 1, content: 'Gerar UI para PRD.md' }
   }

2. Frontend Agent -> Test Generator: {
     type: 'task',
     payload: { content: 'Gerar testes para componentes' }
   }

3. Test Generator -> Code Reviewer: {
     type: 'result',
     payload: { artifacts: ['src/**/*.test.tsx'] }
   }

4. Code Reviewer -> Meta-Orchestrator: {
     type: 'feedback',
     payload: { score: 0.92, content: 'Aprovado' }
   }

5. Meta-Orchestrator -> Deploy Agent: {
     type: 'task',
     payload: { content: 'Deploy em develop' }
   }

6. Deploy Agent -> Notification Agent: {
     type: 'result',
     payload: { url: 'https://projeto-dev.vercel.app' }
   }

7. Notification Agent -> Meta-Orchestrator: {
     type: 'approval',
     payload: { content: 'Fase 1 notificada no Telegram' }
   }
```

---

## Delegacao do Meta-Orchestrator

### Por Fase

| Fase | Agentes Delegados |
|------|-------------------|
| 0 | Design System Generator |
| 1 | Frontend Agent → Test Generator → Code Reviewer → Deploy Agent → Notification Agent |
| 2 | Database Agent → Code Executor → Test Generator → Code Reviewer → Deploy Agent → Notification Agent |
| 3 | Integration Agent → Test Generator → Code Reviewer → Deploy Agent → Notification Agent |
| 4 | Landing Page Agent → Legal Generator → Help Center Generator → Admin Panel Agent → AI Support Agent* → Code Reviewer → Deploy Agent → Ops Telegram Agent |
| Final | Deploy Agent (producao) → Ops Telegram Agent |

### Comandos de Delegacao

```markdown
## Para Design System Generator
→ "Gere Design System a partir de BRAND.md"

## Para Frontend Agent
→ "Gere frontend para Fase 1 do PRD.md"

## Para Database Agent
→ "Gere migrations para Fase 2 do PRD.md"

## Para Code Executor
→ "Gere Edge Functions para Fase 2 do PRD.md"

## Para Integration Agent
→ "Integre frontend com backend para Fase 3"

## Para Landing Page Agent
→ "Gere landing page conforme PRD.md e BRAND.md"

## Para Legal Generator
→ "Gere termos de uso e politica de privacidade"

## Para Test Generator
→ "Gere testes para [lista de arquivos]"

## Para Code Reviewer
→ "Review [lista de arquivos]"

## Para Deploy Agent
→ "Deploy em develop" / "Deploy em producao"

## Para Notification Agent
→ "Notifique Fase N concluida com link {url}"
```

---

## Estado do Projeto

O Meta-Orchestrator mantem estado em:

```json
// .orchestra/state.json
{
  "projectName": "MeuProjeto",
  "startedAt": "2026-01-31T10:00:00-03:00",
  "currentPhase": 2,
  "phases": {
    "0": { "status": "completed", "completedAt": "..." },
    "1": { "status": "completed", "deployUrl": "..." },
    "2": { "status": "in_progress", "startedAt": "..." },
    "3": { "status": "pending" },
    "4": { "status": "pending" },
    "final": { "status": "pending" }
  }
}
```

---

## Registro de Sessoes

Todo output de agente gera registro em `sessions/session-YYYYMMDD-HHMM-titulo.md`:

```markdown
[SESSION]
Timestamp: 2026-01-31T10:30-03:00
Agente: Frontend Agent
Solicitante: Meta-Orchestrator
Fase: 1

Tarefa:
- Gerar UI para PRD.md

Arquivos gerados:
- src/app/(app)/dashboard/page.tsx
- src/features/tasks/components/TaskList.tsx
- ...

Review:
- Code Reviewer: score 0.92

Conclusao:
Frontend Fase 1 completo.
```

---

## Expansao Futura

Para adicionar um novo agente:

1. Criar arquivo em `agents/novo-agente.md`
2. Adicionar a tabela de agentes neste documento
3. Definir em qual fase sera chamado
4. Atualizar Meta-Orchestrator para delegar
5. Atualizar CLAUDE.md se necessario

### Sugestoes de Novos Agentes

| Agente | Proposito |
|--------|-----------|
| **Acessibilidade** | WCAG compliance, ARIA, screen readers |
| **Analytics** | Eventos, metricas, dashboards |
| **i18n** | Internacionalizacao, traducoes |
| **Performance** | Core Web Vitals, bundle size, otimizacoes |
| **Mobile** | React Native, PWA, responsive avancado |

---

## Referencias

### Documentacao de Arquitetura

| Documento | Conteudo |
|-----------|----------|
| [01-arquitetura.md](01-arquitetura.md) | Clean Architecture + Feature-Sliced Design |
| [02-design-system.md](02-design-system.md) | shadcn/ui, Tailwind, tokens |
| [04-seguranca.md](04-seguranca.md) | OWASP, RLS, RBAC, Audit |
| [05-testes.md](05-testes.md) | Vitest, Testing Library |
| [06-migrations.md](06-migrations.md) | DATABASE.md, migrations |

### Documentacao de Funcionalidades Padrao

| Documento | Conteudo |
|-----------|----------|
| [16-admin-panel.md](16-admin-panel.md) | Padroes do Admin Panel |
| [17-ai-support.md](17-ai-support.md) | AI Support Chat (schemas, componentes) |
| [18-notifications.md](18-notifications.md) | Sistema de Notificacoes (schemas, componentes) |
| [19-usage-limits.md](19-usage-limits.md) | Limites de Uso (schemas, componentes) |
| [20-promotional-bars.md](20-promotional-bars.md) | Barras Promocionais (schemas, componentes) |

### Agentes e Configuracao

- [Meta-Orchestrator](../agents/meta-orchestrator.md) - Coordenador principal
- [12-checklist-humano.md](12-checklist-humano.md) - Pre-requisitos humanos
- [11-environments.md](11-environments.md) - Ambientes develop/production
- [CLAUDE.md](../../CLAUDE.md) - Configuracao do Claude Code
