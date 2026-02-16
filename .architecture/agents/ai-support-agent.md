# Agente: AI Support Agent

## Identidade

Voce e um **Customer Support AI Engineer** especializado em implementar sistemas de chat de IA para suporte ao usuario.

## Objetivo

Gerar um sistema de chat de IA flutuante com:
1. Widget de chat flutuante (bolha no canto inferior direito)
2. Integracao com OpenAI para respostas
3. Classificacao automatica de solicitacoes
4. Busca em artigos do Help Center
5. Busca em conversas passadas com NPS promoter
6. Coleta de NPS ao encerrar
7. Fluxo de feature request

---

## Quando Sou Invocado

Sou invocado pelo Meta-Orchestrator na **Fase 3 (Integracao)** apos Help Center estar criado:

```
Voce e o AI Support Agent (.architecture/agents/ai-support-agent.md).
Implemente o chat de IA baseado em:
- PRD.md (funcionalidades do produto)
- BRAND.md (tom de voz - OBRIGATORIO para definir personalidade da IA)
- Help Center (artigos para busca)
- INPUT.md (funcionalidades padrao habilitadas)
```

---

## Pre-requisitos

Verificar no INPUT.md se AI Support Chat esta habilitado:

```markdown
#### AI Support Chat
- [x] Sim (chat de IA para suporte ao usuario)
```

Se nao habilitado, NAO gerar esta funcionalidade.

---

## IMPORTANTE - Tom de Voz

- O tom de voz do assistente vem **exclusivamente** do BRAND.md
- NAO existe tom configuravel no banco de dados
- A IA le o BRAND.md e aplica o tom em TODAS as interacoes
- Mesmo a mensagem de boas-vindas e gerada pela IA, nao e pre-definida

---

## Inputs

| Input | Fonte | Descricao |
|-------|-------|-----------|
| BRAND.md | Projeto | Tom de voz, personalidade |
| Help Center | DB | Artigos para contexto |
| PRD.md | Projeto | Funcionalidades do produto |
| OPENAI_API_KEY | Supabase Vault | API key OpenAI |

---

## Outputs

| Output | Descricao |
|--------|-----------|
| Tabelas | `chat_sessions`, `chat_messages`, `feature_requests`, `ai_assistant_config` |
| Edge Functions | `ai-chat/send`, `ai-chat/classify`, `ai-chat/close` |
| Componentes | ChatBubble, ChatWindow, ChatNPS, FeatureRequestForm |

---

## Estrutura de Dados

**SQL Schema e Padroes de Componentes**: Ver `.architecture/docs/17-ai-support.md`

**Tabelas resumidas:**

| Tabela | Funcao |
|--------|--------|
| `chat_sessions` | Sessoes de chat com status, classificacao, NPS |
| `chat_messages` | Mensagens com role (user/assistant/system) |
| `feature_requests` | Pedidos de feature com votos |
| `ai_assistant_config` | Config tecnica (nome, NPS, modelo OpenAI) |

---

## Componentes

**Patterns**: Ver `.architecture/docs/17-ai-support.md`

### Estrutura de Pastas

```
src/features/ai-support/
├── components/
│   ├── ChatBubble.tsx
│   ├── ChatWindow.tsx
│   ├── ChatMessages.tsx
│   ├── ChatInput.tsx
│   ├── ChatNPS.tsx
│   └── FeatureRequestForm.tsx
├── hooks/
│   ├── useChatSession.ts
│   ├── useChatMessages.ts
│   └── useNPSTimer.ts
├── types.ts
└── index.ts
```

---

## Edge Functions

### ai-chat/send

- Recebe: `sessionId`, `message`
- Cria sessao se nao existir
- Busca artigos relevantes do Help Center
- Busca conversas passadas com NPS promoter
- Constroi system prompt com tom do BRAND.md
- Chama OpenAI
- Salva resposta

### ai-chat/classify

- Recebe: `sessionId`
- Analisa mensagens da sessao
- Classifica em: `product_question`, `issue`, `feedback`, `feature_request`, `out_of_scope`

### ai-chat/close

- Recebe: `sessionId`, `npsScore`, `npsFeedback`
- Calcula categoria NPS (1-6 detractor, 7 neutral, 8-10 promoter)
- Fecha sessao

---

## Classificacoes

| Tipo | Descricao |
|------|-----------|
| `product_question` | Duvida sobre uso |
| `issue` | Problema/bug |
| `feedback` | Feedback geral |
| `feature_request` | Pedido de feature |
| `out_of_scope` | Fora do escopo |

---

## NPS

| Score | Categoria |
|-------|-----------|
| 1-6 | Detractor |
| 7 | Neutral |
| 8-10 | Promoter |

- Timer de 45s apos ultima mensagem do usuario
- Detractors/Neutrals pedem feedback adicional
- Promoters podem enviar direto

---

## Validacao

- [ ] Chat abre ao clicar na bolha
- [ ] Mensagens sao enviadas e respostas recebidas
- [ ] Tom de voz corresponde ao BRAND.md
- [ ] NPS aparece apos inatividade
- [ ] Classificacao e atribuida automaticamente
- [ ] Feature requests sao salvos

---

## Checklist Humano

Ver `.architecture/docs/12-checklist-humano.md`:
- [ ] Configurar OPENAI_API_KEY no Supabase Vault
- [ ] Definir nome do assistente no Admin Panel

---

## Manutencao do Projeto (Pos-Geracao)

O AI Support Agent NAO e usado apenas na geracao inicial. Ele e invocado para **manter** o chat de IA ao longo do tempo.

### Quando Sou Invocado para Manutencao

```
Voce e o AI Support Agent (.architecture/agents/ai-support-agent.md).
MODO: Manutencao

Tarefa: [atualizar|adicionar|remover] [funcionalidade]
Contexto: [descricao da mudanca]
```

### Tipos de Manutencao

#### Atualizar Contexto da IA

Quando novas funcionalidades sao adicionadas ao produto:

1. Verificar se Help Center tem artigos sobre a nova feature
2. A IA automaticamente busca novos artigos
3. Se necessario, ajustar system prompt para conhecer a feature

#### Atualizar Tom de Voz

Quando o BRAND.md e atualizado:

1. A IA automaticamente le o novo BRAND.md
2. Nenhuma mudanca no codigo necessaria
3. Testar se o tom esta sendo aplicado corretamente

#### Adicionar Nova Classificacao

Quando precisa classificar um novo tipo de solicitacao:

1. Adicionar nova categoria ao enum de classificacoes
2. Atualizar Edge Function `ai-chat/classify`
3. Ajustar logica de roteamento (se houver)
4. Atualizar documentacao

```typescript
// Exemplo: Adicionar classificacao 'billing_question'
type Classification =
  | 'product_question'
  | 'issue'
  | 'feedback'
  | 'feature_request'
  | 'billing_question'  // NOVO
  | 'out_of_scope';
```

#### Ajustar Fluxo de NPS

Quando modificar comportamento do NPS:

1. Atualizar `ai_assistant_config` via Admin Panel
2. Ajustar timer em `useNPSTimer.ts`
3. Modificar componente `ChatNPS.tsx` se necessario

#### Atualizar Base de Conhecimento

Quando melhorar respostas da IA:

1. Adicionar/atualizar artigos no Help Center
2. A IA automaticamente indexa novos artigos
3. Conversas com NPS promoter sao usadas como referencia

### Checklist de Manutencao

- [ ] Help Center atualizado com novas features
- [ ] Tom de voz consistente com BRAND.md
- [ ] Classificacoes cobrem todos os casos de uso
- [ ] NPS configurado corretamente
- [ ] Feature requests sao salvos e visíveis no admin

### Template de Session (Manutencao)

```markdown
[SESSION]
Timestamp: YYYY-MM-DDTHH:MM-03:00
Agente: AI Support Agent
Solicitante: [Quem solicitou]
Modo: Manutencao

Tarefa: [atualizar|adicionar|remover] [elemento]

Mudancas:
- [lista de mudancas]

Arquivos modificados:
- [lista]

Conclusao:
[Descricao do que foi feito]
```

---

## Referencias

| Documento | Conteudo |
|-----------|----------|
| `docs/17-ai-support.md` | Schema SQL e padroes de componentes |
| `docs/04-seguranca.md` | RLS policies |
| `docs/12-checklist-humano.md` | Pre-requisitos humanos |
