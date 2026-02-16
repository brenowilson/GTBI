# AI Support Chat - Padroes e Especificacoes

Este documento define os padroes para implementacao do AI Support Chat em projetos do framework.

---

## Visao Geral

O AI Support Chat e um widget de chat flutuante com IA para suporte ao usuario. Inclui:

1. Widget de chat flutuante (bolha no canto inferior direito)
2. Integracao com OpenAI para respostas
3. Classificacao automatica de solicitacoes
4. Busca em artigos do Help Center
5. Busca em conversas passadas com NPS promoter
6. Coleta de NPS ao encerrar
7. Fluxo de feature request

---

## IMPORTANTE - Tom de Voz

- O tom de voz do assistente vem **exclusivamente** do BRAND.md
- NAO existe tom configuravel no banco de dados
- A IA le o BRAND.md e aplica o tom em TODAS as interacoes
- Mesmo a mensagem de boas-vindas e gerada pela IA, nao e pre-definida

---

## Estrutura de Pastas

```
src/features/ai-support/
├── components/
│   ├── ChatBubble.tsx           # Bolha flutuante
│   ├── ChatWindow.tsx           # Janela do chat
│   ├── ChatMessages.tsx         # Lista de mensagens
│   ├── ChatInput.tsx            # Input de mensagem
│   ├── ChatNPS.tsx              # Coleta de NPS
│   └── FeatureRequestForm.tsx   # Form de feature request
├── hooks/
│   ├── useChatSession.ts        # Gerenciar sessao
│   ├── useChatMessages.ts       # Enviar/receber mensagens
│   └── useNPSTimer.ts           # Timer para NPS
├── types.ts
└── index.ts
```

---

## Schema SQL

```sql
-- ============================================
-- AI SUPPORT CHAT
-- ============================================

-- Sessoes de chat
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'closed', 'escalated'

  -- Classificacao (preenchida durante conversa)
  classification TEXT,   -- 'product_question', 'issue', 'feedback', 'feature_request', 'out_of_scope'

  -- NPS
  nps_score INTEGER CHECK (nps_score >= 1 AND nps_score <= 10),
  nps_category TEXT,     -- 'detractor', 'neutral', 'promoter'
  nps_feedback TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Mensagens do chat
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,

  -- Conteudo
  role TEXT NOT NULL,     -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,

  -- Metadata
  tokens_used INTEGER,
  sources JSONB,          -- Artigos/conversas usados como fonte
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pedidos de feature
CREATE TABLE public.feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Conteudo
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'planned', 'in_progress', 'done', 'rejected'

  -- Votos
  votes INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Configuracao do assistente
-- NOTA: Tom de voz e mensagens sao gerados pela IA usando BRAND.md
CREATE TABLE public.ai_assistant_config (
  id TEXT PRIMARY KEY DEFAULT 'singleton',

  -- Identidade (apenas nome, tom vem do BRAND.md)
  assistant_name TEXT NOT NULL DEFAULT 'Assistente',

  -- NPS
  nps_enabled BOOLEAN DEFAULT true,
  nps_delay_seconds INTEGER DEFAULT 45,

  -- OpenAI
  model TEXT DEFAULT 'gpt-4o-mini',
  max_tokens INTEGER DEFAULT 500,
  temperature NUMERIC DEFAULT 0.7,

  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_sessions_nps ON chat_sessions(nps_category) WHERE nps_category = 'promoter';
CREATE INDEX idx_feature_requests_status ON feature_requests(status);
```

---

## Padroes de Componentes

### ChatBubble

- Posicao: `fixed bottom-4 right-4 z-50`
- Tamanho do botao: `h-14 w-14 rounded-full`
- Animacao: slide-up da janela quando abre
- Icone: MessageCircle quando fechado, X quando aberto

```tsx
// src/features/ai-support/components/ChatBubble.tsx
export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}

      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
}
```

### ChatWindow

- Tamanho: `w-80 md:w-96 h-[500px]`
- Layout: Card com header, content scrollable, input fixo no bottom
- Header mostra nome do assistente (da config)
- Transicao suave para tela de NPS

### ChatNPS

- Score de 1-10 em botoes horizontais
- Cores: 1-6 vermelho, 7 amarelo, 8-10 verde
- Detractors/Neutrals vao para feedback adicional
- Promoters podem enviar direto

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
| `product_question` | Duvida sobre uso do produto |
| `issue` | Problema/bug reportado |
| `feedback` | Feedback geral sobre o produto |
| `feature_request` | Pedido de nova funcionalidade |
| `out_of_scope` | Fora do escopo do suporte |

---

## NPS

| Score | Categoria |
|-------|-----------|
| 1-6 | Detractor |
| 7 | Neutral |
| 8-10 | Promoter |

**Fluxo:**
1. Timer de 45s apos ultima mensagem do usuario
2. Mostrar tela de NPS
3. Detractors/Neutrals pedem feedback adicional
4. Promoters podem enviar direto
5. Salvar e fechar sessao

---

## Integracao no Layout

```tsx
// No layout principal
import { ChatBubble } from '@/features/ai-support';

export function AppLayout({ children }) {
  return (
    <div>
      {children}
      <ChatBubble />
    </div>
  );
}
```

---

## RLS Policies

Ver `.architecture/docs/04-seguranca.md` secao "AI Support Chat" para policies completas.

---

## Checklist Humano

Ver `.architecture/docs/12-checklist-humano.md`:
- [ ] Configurar OPENAI_API_KEY no Supabase Vault
- [ ] Definir nome do assistente no Admin Panel

---

## Referencias

| Documento | Conteudo |
|-----------|----------|
| `docs/04-seguranca.md` | RLS policies |
| `docs/12-checklist-humano.md` | Pre-requisitos humanos |
| `agents/ai-support-agent.md` | Instrucoes de execucao |
