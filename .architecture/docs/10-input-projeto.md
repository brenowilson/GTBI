# Input de Projeto para Geracao de PRD

## Visao Geral

Este documento define o **input minimo** que um usuario precisa fornecer para que um PRD completo seja gerado automaticamente. O objetivo e reduzir a barreira de entrada, permitindo que ideias sejam transformadas em especificacoes estruturadas com minimo esforco inicial.

---

## Fluxo de Geracao

```
┌─────────────────────────────────────────────────────────┐
│                    INPUT DO USUARIO                     │
│            (Descricao user-friendly)                    │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   AGENTE GERADOR                        │
│   - Analisa input                                       │
│   - Infere requisitos                                   │
│   - Gera PRD estruturado                                │
│   - Marca pontos de decisao                             │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   PRD DRAFT (v0)                        │
│   - Requisitos inferidos                                │
│   - [DECISAO] pontos que precisam input humano          │
│   - Sugestoes com alternativas                          │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 REVISAO HUMANA                          │
│   - Agente apresenta pontos de decisao                  │
│   - Humano confirma/ajusta/expande                      │
│   - Loop ate aprovacao                                  │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   PRD FINAL (v1)                        │
│   - Pronto para execucao                                │
│   - Todas as decisoes resolvidas                        │
└─────────────────────────────────────────────────────────┘
```

---

## Campos Obrigatorios

### 1. Nome do Projeto
**O que e**: Nome curto e memoravel para o produto.

```
Exemplo: "TaskFlow"
```

### 2. Idioma da Interface
**O que e**: Idioma principal da interface e conteudo user-facing.

```
Idioma da Interface:
- [ ] Portugues (pt-BR)
- [ ] Ingles (en-US)
- [ ] Espanhol (es)
- [ ] Outro: _______________
```

**Importante**: Independente do idioma escolhido para a interface:
- Todo **codigo fonte** deve ser em **ingles** (variaveis, funcoes, classes, comentarios tecnicos)
- Todas **tabelas e colunas** do banco devem ser em **ingles**
- **Commits** devem ser em **ingles**
- **Nomes de arquivos** devem ser em **ingles**

Apenas o conteudo user-facing (textos de UI, mensagens de erro para usuario, documentacao de ajuda) segue o idioma escolhido.

### 3. Tipo de Projeto
**O que e**: Define a natureza do acesso ao sistema.

```
Acesso ao Sistema:
- [ ] Publico (qualquer pessoa pode se cadastrar)
- [ ] Privado/Interno (apenas usuarios convidados)

Cadastro de Usuarios:
- [ ] Self-service (usuarios se cadastram sozinhos)
- [ ] Apenas convite (usuarios sao convidados)

Landing Page:
- [ ] Sim (pagina de marketing com SEO)
- [ ] Nao (ponto de entrada e a tela de login)

Multiplos Usuarios/Organizacoes:
- [ ] Sim (times/organizacoes com multiplos membros)
- [ ] Nao (apenas usuarios individuais)
```

**Implicacoes das escolhas:**

| Opcao | Consequencia |
|-------|--------------|
| Publico + Self-service | Landing page, cadastro, SEO, Google Analytics |
| Privado + Convite | Sem landing page, sem cadastro publico, entrada pelo login |
| Multiplos usuarios | Sistema de roles, convite por email, gestao de membros |
| Sem multiplos usuarios | Usuario individual, sem roles complexas |

**Nota**: Projetos privados (internos) NAO devem ter:
- Landing page publica
- Tracking via Google Analytics
- Indexacao por buscadores (robots.txt: noindex)

**Automatico para TODOS os projetos com usuarios:**
- Checkbox de aceite de Termos de Uso e Politica de Privacidade no cadastro
- Registro de timestamp do aceite no banco de dados
- Verificacao de aceite pendente no login (quando termos forem atualizados)
- Email de notificacao quando termos/privacidade forem atualizados
- Links legais no footer (Termos, Privacidade, Central de Ajuda)

Ver detalhes em [`.architecture/agents/legal-generator.md`](../agents/legal-generator.md#sistema-de-aceite-de-termos-legais-obrigatorio).

### 4. Descricao em Uma Frase
**O que e**: Elevator pitch - o que o produto faz em uma frase.

```
Exemplo: "App de gerenciamento de tarefas para times pequenos"
```

### 5. Problema que Resolve
**O que e**: Qual dor/necessidade o produto atende. Por que alguem usaria isso?

```
Exemplo: "Times pequenos perdem tempo com ferramentas complexas como Jira.
Precisam de algo simples para organizar tarefas do dia a dia sem overhead."
```

### 6. Usuarios-Alvo
**O que e**: Quem vai usar o produto. Pode ser generico ou especifico.

```
Exemplo: "Times de 2-10 pessoas em startups ou pequenas empresas"
```

### 7. Funcionalidades Principais (3-7 itens)
**O que e**: Lista das coisas mais importantes que o produto precisa fazer.

```
Exemplo:
- Criar e organizar tarefas
- Atribuir tarefas a membros do time
- Ver progresso do time
- Notificacoes quando tarefas sao atualizadas
```

---

## Campos Opcionais (Enriquecem o PRD)

### 8. O que NAO e (Non-Goals)
**O que e**: Funcionalidades que explicitamente NAO serao incluidas.

```
Exemplo:
- Nao e um Jira - nao tera sprints, epics, story points
- Nao tera app mobile nativo (apenas web responsivo)
- Nao tera integracao com 50 ferramentas
```

### 9. Concorrentes/Referencias
**O que e**: Produtos similares que servem de referencia (positiva ou negativa).

```
Exemplo:
- Linear (inspiracao: UI limpa)
- Todoist (inspiracao: simplicidade)
- Jira (anti-referencia: muito complexo)
```

### 10. Diferenciais
**O que e**: O que torna este produto unico ou melhor que alternativas.

```
Exemplo:
- Setup em 2 minutos, sem configuracao
- Focado em times pequenos, sem features enterprise
- Preco acessivel (ou gratis)
```

### 11. Restricoes Tecnicas
**O que e**: Limitacoes ou requisitos tecnicos especificos.

```
Exemplo:
- Precisa funcionar offline
- Dados devem ficar no Brasil (LGPD)
- Integracao obrigatoria com Slack
```

### 12. Metricas de Sucesso
**O que e**: Como saberemos se o produto esta funcionando.

```
Exemplo:
- 70% dos usuarios voltam na segunda semana
- NPS > 40
- Time de 5 pessoas consegue usar sem treinamento
```

### 13. Central de Ajuda (Help Center)
**O que e**: Configuracao de acesso para a Central de Ajuda gerada automaticamente.

```
Opcoes:
- [x] Acesso publico (qualquer pessoa pode ver)
- [ ] Acesso autenticado (apenas usuarios logados)
```

A Central de Ajuda e gerada automaticamente ao final do projeto, contendo artigos user-friendly sobre todas as funcionalidades. Os artigos ficam em `docs/help-center/` e sao renderizados no frontend.

### 14. Integracoes Externas (opcional)
**O que e**: Servicos externos que o produto ira utilizar.

```
Gateway de Pagamento:
- [ ] Nenhum
- [ ] Stripe
- [ ] Mercado Pago
- [ ] PagSeguro
- [ ] Outro: ___

Email Transacional:
- [ ] Nenhum
- [ ] Resend
- [ ] SendGrid
- [ ] AWS SES
- [ ] Outro: ___

Outras:
- [ ] Slack
- [ ] Google Analytics
- [ ] Sentry
- [ ] Cloudinary
- [ ] OpenAI
- [ ] Outro: ___
```

O Integration Agent ira configurar as integracoes marcadas. Se nenhum gateway de pagamento for selecionado, features de billing nao serao geradas.

### 15. Funcionalidades Padrao do Sistema
**O que e**: Funcionalidades opcionais que podem ser habilitadas no projeto.

```
#### AI Support Chat
Chat flutuante com IA para suporte ao usuario.
- [ ] Sim (chat de IA para suporte ao usuario)
- [ ] Nao

Inclui:
- Widget de chat flutuante (bolha)
- Integracao com OpenAI
- Classificacao automatica de solicitacoes
- Busca em artigos do Help Center
- NPS ao encerrar conversa
- Formulario de feature request

Requer: OPENAI_API_KEY

#### Sistema de Notificacoes
Canais de notificacao para o usuario.
- [ ] Internas (sininho no header)
- [ ] Email (via Resend/SendGrid)
- [ ] Push (PWA - requer VAPID keys)

Inclui:
- NotificationBell.tsx no header
- Preferencias de notificacao por tipo
- Tab de configuracoes de notificacao

#### Limites de Uso
Sistema de limites por plano com alertas.
- [ ] Sim (alertas de limite 80%/100% + upgrade CTA)
- [ ] Nao

Inclui:
- Barra amarela quando atingir 80% do limite
- Barra vermelha quando atingir 100%
- Botao de upgrade para plano superior
- Tracking de uso por recurso

Requer: Sistema de billing/planos

#### Barras Promocionais (Admin)
Barras customizaveis no topo da aplicacao.
- [ ] Sim (admin pode criar barras customizaveis)
- [ ] Nao

Inclui:
- Editor de barra promocional no admin
- Preview em tempo real
- Agendamento por data
- Opcao de fechar (closeable)
- Segmentacao por plano/role

#### Criacao de Notificacoes (Admin)
Wizard para enviar notificacoes em massa.
- [ ] Sim (admin pode enviar notificacoes)
- [ ] Nao

Inclui:
- Wizard de 4 passos (canais, conteudo, audiencia, preview)
- Preview por canal (interno, email, push)
- Segmentacao por usuarios, planos ou roles
- Historico de notificacoes enviadas
```

**Implicacoes das escolhas:**

| Funcionalidade | Tabelas Criadas | Edge Functions | Componentes |
|----------------|-----------------|----------------|-------------|
| AI Support Chat | chat_sessions, chat_messages, feature_requests, ai_assistant_config | ai-chat/* | ChatBubble, ChatWindow, ChatNPS |
| Notificacoes (Internas) | notifications, notification_preferences, notification_types | send-notification | NotificationBell, NotificationDropdown |
| Notificacoes (Push) | push_subscriptions | push-subscribe | PushPermissionPrompt |
| Limites de Uso | plan_limits, usage_tracking | check-usage | UsageLimitBanner, UpgradeCTA |
| Barras Promocionais | promotional_bars, promotional_bar_dismissals | - | PromotionalBarEditor, PromotionalBar |
| Criacao de Notificacoes | admin_notifications | admin-send-notification | NotificationWizard |

---

## Template de Input (Copiar e Preencher)

```markdown
# Briefing do Projeto

## Nome
[Nome do produto]

## Idioma da Interface
- [ ] Portugues (pt-BR)
- [ ] Ingles (en-US)
- [ ] Espanhol (es)
- [ ] Outro: _______________

## Em uma frase
[O que o produto faz - max 15 palavras]

## Tipo de Projeto

### Acesso ao Sistema
- [ ] Publico (qualquer pessoa pode se cadastrar)
- [ ] Privado/Interno (apenas usuarios convidados)

### Cadastro de Usuarios
- [ ] Self-service (usuarios se cadastram sozinhos via landing page)
- [ ] Apenas convite (usuarios sao convidados por admins/membros)

### Landing Page
- [ ] Sim (pagina de marketing com SEO)
- [ ] Nao (ponto de entrada e a tela de login)

### Multiplos Usuarios/Organizacoes
- [ ] Sim (times/organizacoes com multiplos membros)
- [ ] Nao (apenas usuarios individuais)

## Problema
[Qual problema resolve? Por que alguem precisa disso?]

## Para quem
[Quem sao os usuarios? Seja especifico]

## Funcionalidades principais
- [ ] [Funcionalidade 1]
- [ ] [Funcionalidade 2]
- [ ] [Funcionalidade 3]
- [ ] [Funcionalidade 4]
- [ ] [Funcionalidade 5]

## O que NAO e (opcional)
- [ ] [Non-goal 1]
- [ ] [Non-goal 2]

## Referencias (opcional)
[Produtos similares, inspiracoes, anti-referencias]

## Diferenciais (opcional)
[O que torna unico]

## Restricoes (opcional)
[Limitacoes tecnicas, legais, de negocio]

## Integracoes Externas (opcional)

### Gateway de Pagamento
- [ ] Nenhum
- [ ] Stripe
- [ ] Mercado Pago
- [ ] PagSeguro
- [ ] Outro: ___

### Email Transacional
- [ ] Nenhum
- [ ] Resend
- [ ] SendGrid
- [ ] Outro: ___

### Outras Integracoes
- [ ] Slack
- [ ] Google Analytics (apenas para projetos publicos)
- [ ] Sentry
- [ ] Cloudinary
- [ ] Outro: ___

## Central de Ajuda
- [ ] Acesso publico (qualquer pessoa pode ver)
- [ ] Acesso autenticado (apenas usuarios logados)

## Funcionalidades Padrao do Sistema

### AI Support Chat
- [ ] Sim (chat de IA para suporte ao usuario)
- [ ] Nao

### Sistema de Notificacoes
Canais de notificacao:
- [ ] Internas (sininho no header)
- [ ] Email (via Resend/SendGrid)
- [ ] Push (PWA)

### Limites de Uso
- [ ] Sim (alertas de limite 80%/100% + upgrade CTA)
- [ ] Nao

### Barras Promocionais (Admin)
- [ ] Sim (admin pode criar barras customizaveis)
- [ ] Nao

### Criacao de Notificacoes (Admin)
- [ ] Sim (admin pode enviar notificacoes)
- [ ] Nao

## Sucesso significa (opcional)
[Como medir se funcionou]
```

---

## Exemplos Completos

### Exemplo Minimo (5 campos)

```markdown
# Briefing do Projeto

## Nome
TaskFlow

## Em uma frase
App de tarefas simples para times pequenos

## Problema
Times pequenos usam Trello/Jira que sao complexos demais.
Perdem tempo configurando ao inves de trabalhando.

## Para quem
Times de 2-10 pessoas em startups

## Funcionalidades principais
- [ ] Criar tarefas com titulo e descricao
- [ ] Atribuir tarefas a pessoas
- [ ] Marcar tarefas como feitas
- [ ] Ver todas as tarefas do time
```

### Exemplo Completo (10 campos)

```markdown
# Briefing do Projeto

## Nome
InvoiceFlow

## Em uma frase
Sistema de faturamento automatizado para freelancers e pequenas agencias

## Problema
Freelancers perdem horas todo mes criando invoices manualmente.
Esquecem de cobrar clientes, perdem controle de pagamentos.
Ferramentas existentes sao caras ou complexas.

## Para quem
- Freelancers de tecnologia/design/marketing
- Pequenas agencias (2-5 pessoas)
- Profissionais autonomos que faturam em USD/EUR/BRL

## Funcionalidades principais
- [ ] Criar invoices com template profissional
- [ ] Enviar invoice por email automaticamente
- [ ] Rastrear status (enviado, visto, pago)
- [ ] Lembretes automaticos para pagamentos atrasados
- [ ] Dashboard com receita mensal/anual
- [ ] Suporte a multiplas moedas

## O que NAO e
- [ ] Nao e um ERP completo
- [ ] Nao faz contabilidade/impostos
- [ ] Nao processa pagamentos (apenas rastreia)
- [ ] Nao tem app mobile nativo (v1)

## Referencias
- Bonsai (inspiracao: simplicidade para freelancers)
- Wave (inspiracao: gratis para pequenos)
- FreshBooks (anti: muito caro, features demais)

## Diferenciais
- Gratis ate 5 clientes
- Setup em 3 minutos
- Templates bonitos sem precisar de designer
- Lembretes automaticos que realmente funcionam

## Restricoes
- Precisa suportar BRL, USD, EUR
- Dados no Brasil (LGPD)
- Integracao com email (nao depender de app)

## Sucesso significa
- Freelancer cria primeiro invoice em < 5 minutos
- 80% dos invoices pagos em ate 30 dias
- NPS > 50
- 1000 usuarios ativos no primeiro ano
```

---

## O que o Agente Infere Automaticamente

A partir do input, o agente gera:

| Input | Inferencia |
|-------|-----------|
| Usuarios-alvo | Personas detalhadas, jornadas |
| Funcionalidades | Requisitos funcionais por fase |
| Referencias | Patterns de UI/UX a seguir |
| Restricoes | Requisitos nao-funcionais |
| Nome/Descricao | Metricas de sucesso sugeridas |

### Decisoes Marcadas para Revisao

O agente marca com `[DECISAO]` pontos que precisam de input humano:

```markdown
### Fase 1: Auth
| ID | Requisito | Prioridade | Criterios |
|----|-----------|------------|-----------|
| FR-101 | Login de usuarios | HIGH | [DECISAO: Magic link ou senha?] |
| FR-102 | Cadastro | HIGH | [DECISAO: Self-service ou convite?] |
```

---

## Processo de Revisao Humana

### 1. Apresentacao do Draft

O agente apresenta o PRD gerado com:
- Resumo das inferencias feitas
- Lista de `[DECISAO]` pendentes
- Sugestoes com pros/cons

### 2. Loop de Refinamento

```
Agente: "Identifiquei 5 pontos que precisam de sua decisao:

1. Autenticacao: Magic link ou email/senha?
   - Magic link: Mais simples, sem gerenciar senhas
   - Email/senha: Usuarios ja conhecem

2. Modelo de pricing: Freemium ou trial?
   ...

Qual sua preferencia para cada um?"

Humano: "1. Magic link. 2. Freemium com limite de 5 projetos..."

Agente: [Atualiza PRD, apresenta proximas decisoes ou confirma finalizacao]
```

### 3. Finalizacao

Quando todas as `[DECISAO]` estao resolvidas:
- Agente gera PRD final
- Remove marcadores de decisao
- Adiciona criterios de aceite detalhados
- Salva como `PRD.md` no projeto

---

## Validacao do Input

### Checklist Minimo

Antes de iniciar geracao, validar:

- [ ] Nome do projeto presente
- [ ] Descricao em uma frase presente
- [ ] Problema claramente definido
- [ ] Usuario-alvo identificado
- [ ] Pelo menos 3 funcionalidades listadas

### Feedback se Incompleto

```
Agente: "Para gerar o PRD, preciso de mais algumas informacoes:

❌ Faltando: Usuarios-alvo
   Quem vai usar o produto? (ex: 'desenvolvedores', 'times de marketing')

❌ Faltando: Funcionalidades
   Liste pelo menos 3 coisas que o produto precisa fazer.

Os outros campos estao OK. Pode completar esses dois?"
```

---

## Integracao com Framework

### Arquivo Gerado

O processo gera `PRD.md` na raiz do projeto seguindo o template de `.architecture/docs/09-prd-template.md`.

### Sessao Registrada

Cada geracao/revisao e registrada:

```markdown
[SESSION]
Timestamp: 2026-01-30T22:00-03:00
Agente: PRD Generator
Solicitante: Breno

Input recebido:
- Nome: TaskFlow
- Descricao: App de tarefas para times pequenos
- ...

Inferencias realizadas:
- 3 personas geradas
- 12 requisitos funcionais em 3 fases
- 5 non-goals inferidos

Decisoes pendentes:
- [ ] Metodo de autenticacao
- [ ] Modelo de pricing
- [ ] Integracao com calendario

Status: Aguardando revisao humana
```

---

## Comandos

```bash
# Iniciar geracao de PRD a partir de briefing
claude "Gere PRD a partir do briefing em BRIEFING.md"

# Revisar PRD existente
claude "Revise PRD.md e liste pontos de decisao pendentes"

# Finalizar PRD apos decisoes
claude "Atualize PRD.md com as decisoes: 1. Magic link, 2. Freemium..."
```
