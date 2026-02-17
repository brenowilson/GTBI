# Invocacao de Agentes

Este documento define como invocar cada agente do framework no Claude Code.

---

## Visao Geral

O framework possui **17 agentes** organizados em dois grupos:

| Tipo | Agentes | Invocacao |
|------|---------|-----------|
| **Usuario** | PRD Generator, Meta-Orchestrator | Usuario invoca diretamente |
| **Orquestrado** | Todos os outros 15 | Meta-Orchestrator invoca |

---

## Agentes Invocados pelo Usuario

### 1. PRD Generator

Transforma briefing em PRD estruturado.

**Quando usar**: Inicio de novo projeto, apos preencher INPUT.md

**Comando**:
```bash
claude "Voce e o PRD Generator (.architecture/agents/prd-generator.md). Gere um PRD completo a partir do briefing em INPUT.md. Siga o template em .architecture/docs/09-prd-template.md. Marque pontos de decisao com [DECISAO] para revisao humana."
```

**Comando curto** (apos contexto carregado):
```bash
claude "Gere PRD a partir de INPUT.md"
```

**Inputs necessarios**:
- `INPUT.md` preenchido (ou `.architecture/examples/INPUT-taskflow.md` como referencia)

**Output**:
- `PRD.md` na raiz do projeto

---

### 2. Meta-Orchestrator

Coordena todo o fluxo PRD → Producao.

**Quando usar**: Apos PRD aprovado, para iniciar geracao automatica

**Comando**:
```bash
claude "Voce e o Meta-Orchestrator (.architecture/agents/meta-orchestrator.md). Inicie a execucao do projeto a partir do PRD.md aprovado. Coordene todos os agentes seguindo o fluxo em .architecture/docs/00-fluxo-agentes.md. Notifique via Telegram ao final de cada fase."
```

**Comando curto**:
```bash
claude "Inicie projeto a partir do PRD.md"
```

**Inputs necessarios**:
- `PRD.md` aprovado (sem marcadores [DECISAO])
- `BRAND.md` preenchido (ou `.architecture/examples/BRAND.md` como referencia)
- Variaveis de ambiente configuradas (ver .architecture/docs/12-checklist-humano.md)

**Output**:
- Projeto completo em producao
- Notificacoes Telegram em cada fase

---

## Agentes Invocados pelo Meta-Orchestrator

Os agentes abaixo sao invocados automaticamente pelo Meta-Orchestrator. Usuarios normalmente nao precisam invoca-los diretamente, mas podem faze-lo para tarefas especificas.

### 3. Design System Generator

**Proposito**: Transforma Brand Manual em Design System

**Invocacao pelo Orchestrator**:
```
Voce e o Design System Generator (.architecture/agents/design-system-generator.md).
Gere o Design System a partir de BRAND.md.
Output: tailwind.config.js, src/styles/globals.css, tokens
```

**Invocacao manual**:
```bash
claude "Gere Design System a partir de BRAND.md seguindo .architecture/agents/design-system-generator.md"
```

---

### 4. Frontend Agent

**Proposito**: Gera UI completa (pages, components, hooks)

**Invocacao pelo Orchestrator**:
```
Voce e o Frontend Agent (.architecture/agents/frontend-agent.md).
Gere o frontend para a Fase 1 do PRD.md.
Use o Design System gerado. Siga arquitetura em .architecture/docs/01-arquitetura.md.
```

**Invocacao manual**:
```bash
claude "Gere frontend para Fase 1 do PRD.md seguindo .architecture/agents/frontend-agent.md"
```

---

### 5. Database Agent

**Proposito**: Gera migrations, RLS, schemas

**Invocacao pelo Orchestrator**:
```
Voce e o Database Agent (.architecture/agents/database-agent.md).
Gere as migrations para a Fase 2 do PRD.md.
Siga padroes em .architecture/docs/06-migrations.md. Aplique RLS conforme .architecture/docs/04-seguranca.md.
```

**Invocacao manual**:
```bash
claude "Gere migrations para Fase 2 do PRD.md seguindo .architecture/agents/database-agent.md"
```

---

### 6. Code Executor

**Proposito**: Executa fases do PRD, gera codigo backend

**Invocacao pelo Orchestrator**:
```
Voce e o Code Executor (.architecture/agents/code-executor.md).
Gere as Edge Functions para a Fase 2 do PRD.md.
Siga arquitetura em .architecture/docs/01-arquitetura.md.
```

**Invocacao manual**:
```bash
claude "Gere Edge Functions para Fase 2 do PRD.md seguindo .architecture/agents/code-executor.md"
```

---

### 7. Integration Agent

**Proposito**: Conecta frontend com backend, integracoes externas

**Invocacao pelo Orchestrator**:
```
Voce e o Integration Agent (.architecture/agents/integration-agent.md).
Integre frontend com backend para a Fase 3 do PRD.md.
Configure integracoes externas conforme especificado no PRD.
```

**Invocacao manual**:
```bash
claude "Integre frontend com backend para Fase 3 seguindo .architecture/agents/integration-agent.md"
```

---

### 8. Landing Page Agent

**Proposito**: Gera landing page com SEO e performance

**Invocacao pelo Orchestrator**:
```
Voce e o Landing Page Agent (.architecture/agents/landing-page-agent.md).
Gere a landing page para a Fase 4 do PRD.md.
Use BRAND.md para copy e design. Otimize para Lighthouse 90+.
```

**Invocacao manual**:
```bash
claude "Gere landing page para Fase 4 seguindo .architecture/agents/landing-page-agent.md"
```

---

### 9. Legal Generator

**Proposito**: Gera termos de uso e politica de privacidade

**Invocacao pelo Orchestrator**:
```
Voce e o Legal Generator (.architecture/agents/legal-generator.md).
Gere Termos de Uso e Politica de Privacidade para a Fase 4.
Siga LGPD. Use dados do PRD.md e BRAND.md.
```

**Invocacao manual**:
```bash
claude "Gere termos e privacidade seguindo .architecture/agents/legal-generator.md"
```

---

### 10. Help Center Generator

**Proposito**: Gera Central de Ajuda com artigos user-friendly

**Invocacao pelo Orchestrator**:
```
Voce e o Help Center Generator (.architecture/agents/help-center-generator.md).
Gere a Central de Ajuda completa baseada em:
- PRD.md (funcionalidades)
- BRAND.md (tom de voz)
- src/features/ (codigo implementado)
- Acesso: [publico|autenticado]
```

**Invocacao manual**:
```bash
claude "Gere Central de Ajuda seguindo .architecture/agents/help-center-generator.md"
```

**Para atualizar apos mudancas**:
```bash
claude "Atualize o Help Center: [feature X] foi [adicionada/modificada/removida]"
```

---

### 11. Admin Panel Agent

**Proposito**: Gera painel administrativo para operacoes e suporte

**Invocacao pelo Orchestrator**:
```
Voce e o Admin Panel Agent (.architecture/agents/admin-panel-agent.md).
Gere o painel administrativo baseado em:
- PRD.md (entidades)
- DATABASE.md (schema)
- 04-seguranca.md (audit logs, RBAC)
```

**Invocacao manual**:
```bash
claude "Gere Admin Panel seguindo .architecture/agents/admin-panel-agent.md"
```

---

### 12. Test Generator

**Proposito**: Gera testes automatizados

**Invocacao pelo Orchestrator**:
```
Voce e o Test Generator (.architecture/agents/test-generator.md).
Gere testes para os arquivos: [lista de arquivos].
Tipos: unit, integration. Siga padroes em .architecture/docs/05-testes.md.
```

**Invocacao manual**:
```bash
claude "Gere testes para src/features/tasks/ seguindo .architecture/agents/test-generator.md"
```

---

### 13. Code Reviewer

**Proposito**: Revisa codigo (maker-checker)

**Invocacao pelo Orchestrator**:
```
Voce e o Code Reviewer (.architecture/agents/code-reviewer.md).
Revise os arquivos: [lista de arquivos].
Retorne score (0-1). Aprovado se >= 0.8. Liste issues se reprovado.
```

**Invocacao manual**:
```bash
claude "Revise src/features/tasks/ seguindo .architecture/agents/code-reviewer.md"
```

---

### 14. Deploy Agent

**Proposito**: Deploy em Vercel e Supabase

**Invocacao pelo Orchestrator**:
```
Voce e o Deploy Agent (.architecture/agents/deploy-agent.md).
Faca deploy em develop. Execute health check apos deploy.
Rollback automatico se falhar.
```

**Invocacao manual**:
```bash
claude "Faca deploy em develop seguindo .architecture/agents/deploy-agent.md"
```

---

### 15. Notification Agent (Produto)

**Proposito**: Implementa sistema de notificacoes do PRODUTO (sininho, email, push)

**IMPORTANTE**: Este e o sistema de notificacoes para USUARIOS do produto, NAO para comunicacao de desenvolvimento. Para notificacoes sobre o DESENVOLVIMENTO, ver Ops Telegram Agent.

**Invocacao pelo Orchestrator** (se habilitado no INPUT.md):
```
Voce e o Notification Agent (.architecture/agents/notification-agent.md).
Implemente o sistema de notificacoes baseado em:
- PRD.md (funcionalidades que geram notificacoes)
- INPUT.md (canais habilitados)
- BRAND.md (tom de voz para mensagens)
```

**Invocacao manual**:
```bash
claude "Implemente sistema de notificacoes seguindo .architecture/agents/notification-agent.md"
```

---

### 16. AI Support Agent

**Proposito**: Implementa chat flutuante de IA para suporte ao usuario

**Invocacao pelo Orchestrator** (se habilitado no INPUT.md):
```
Voce e o AI Support Agent (.architecture/agents/ai-support-agent.md).
Implemente o chat de IA baseado em:
- PRD.md (funcionalidades do produto)
- BRAND.md (tom de voz - OBRIGATORIO para definir personalidade da IA)
- Help Center (artigos para busca)
- INPUT.md (funcionalidades padrao habilitadas)
```

**Invocacao manual**:
```bash
claude "Implemente AI Support Chat seguindo .architecture/agents/ai-support-agent.md"
```

---

### 17. Ops Telegram Agent

**Proposito**: Notificacoes Telegram sobre DESENVOLVIMENTO do projeto (fases concluidas, erros, deploy)

**IMPORTANTE**: Este agente e OPERACIONAL - notifica sobre o desenvolvimento, NAO e uma funcionalidade do produto. Para sistema de notificacoes do produto (sininho, email, push), ver Notification Agent.

**Invocacao pelo Orchestrator**:
```
Voce e o Ops Telegram Agent (.architecture/agents/ops-telegram-agent.md).
Notifique conclusao da Fase N.
Inclua: status, URL de deploy, proximos passos.
```

**Invocacao manual**:
```bash
claude "Notifique Fase 1 concluida com URL https://... seguindo .architecture/agents/ops-telegram-agent.md"
```

---

## Fluxo Completo de Comandos

### Novo Projeto (do zero)

```bash
# 1. Preparar inputs
cp .architecture/examples/INPUT-taskflow.md INPUT.md
cp .architecture/examples/BRAND.md BRAND.md
# Editar INPUT.md e BRAND.md com dados do seu projeto

# 2. Gerar PRD
claude "Gere PRD a partir de INPUT.md"

# 3. Revisar PRD (responder perguntas do agente)
# O agente apresentara pontos de [DECISAO]
# Responda cada um ate o PRD estar aprovado

# 4. Iniciar geracao automatica
claude "Inicie projeto a partir do PRD.md"

# 5. Aguardar notificacoes no Telegram
# Projeto sera gerado automaticamente ate producao
```

### Apenas Design System

```bash
claude "Gere Design System a partir de BRAND.md"
```

### Apenas Frontend de uma Fase

```bash
claude "Gere frontend para Fase 1 do PRD.md"
```

### Apenas Testes

```bash
claude "Gere testes para src/features/"
```

### Apenas Deploy

```bash
claude "Faca deploy em develop"
claude "Promova develop para producao"
```

---

## Contexto Automatico

Quando o Claude Code e iniciado na pasta do projeto, ele automaticamente carrega:

1. `CLAUDE.md` - Configuracoes e convencoes
2. `PRD.md` - Requisitos do projeto (se existir)
3. `BRAND.md` - Manual de marca (se existir)

Isso permite usar comandos curtos como:
- `"Gere PRD"` ao inves do comando completo
- `"Inicie projeto"` ao inves de especificar arquivos

---

## Troubleshooting

### Agente nao encontra arquivo

```bash
# Verificar se arquivos existem
ls -la INPUT.md BRAND.md PRD.md

# Verificar se esta na pasta correta
pwd
```

### Agente nao segue instrucoes do agent file

```bash
# Forcar leitura do arquivo de agente
claude "Leia agents/frontend-agent.md e siga as instrucoes para gerar o frontend"
```

### Notificacao Telegram nao funciona

```bash
# Testar manualmente
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=Teste de notificacao"
```

---

## Referencias

- [.architecture/agents/](../agents/) - Arquivos de definicao de cada agente
- [.architecture/docs/00-fluxo-agentes.md](00-fluxo-agentes.md) - Fluxo de orquestracao
- [.architecture/docs/12-checklist-humano.md](12-checklist-humano.md) - Pre-requisitos
- [.architecture/examples/](../examples/) - Exemplos preenchidos de INPUT e BRAND
