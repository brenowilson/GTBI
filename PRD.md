# PRD: GTBI — GT Business Intelligence

## 1. Sumario Executivo

- **Visao**: Sistema interno da GT Consultoria que conecta em contas iFood (multi-conta, multi-restaurante), coleta e armazena dados diarios, acelera analise e decisao do time com rastreabilidade completa, e gera relatorios semanais em PDF para envio por email e WhatsApp com auditoria.
- **Usuarios-Alvo**:
  - **Persona 1 — Analista GT**: Membro operacional que monitora metricas de restaurantes, executa acoes (ajustes de cardapio, respostas a avaliacoes, promocoes) e registra evidencias. Dor: tempo excessivo coletando dados manualmente no iFood. Objetivo: ter dashboard consolidado com alertas e agir rapido.
  - **Persona 2 — Gestor GT (Admin)**: Lider da consultoria que supervisiona todos os restaurantes, aprova relatorios, gerencia equipe e valida acoes estrategicas. Dor: falta de visao consolidada e auditoria. Objetivo: saber o que foi feito, por quem, quando, com resultado.
- **Metricas de Sucesso**:
  - Relatorio semanal (PDF) gerado automaticamente para 100% dos restaurantes ativos ate segunda-feira
  - Envio manual com auditoria completa em <3 cliques
  - Tempo medio de resposta a avaliacao (quando auto-responder ligado): <5min apos recebimento
  - 100% das acoes com rastreabilidade (quem, quando, evidencia)
  - PWA instalavel com score Lighthouse >90

---

## 2. Idioma e Tipo de Projeto

### Idioma da Interface
- [x] Portugues (pt-BR)

**Nota**: Independente do idioma da interface, todo codigo (variaveis, funcoes, tabelas, commits) deve ser em ingles.

### Acesso ao Sistema
- [x] **Privado/Interno** — Apenas usuarios convidados

### Cadastro de Usuarios
- [x] **Apenas convite** — Usuarios sao adicionados por admins/membros (convite por email)

### Landing Page
- [x] **Nao** — Ponto de entrada e a tela de login (sem landing page)

### Multiplos Usuarios/Organizacoes
- [x] **Sim** — Usuarios internos GT Consultoria com roles e permissoes

**Implicacoes:**

| Configuracao | Consequencia |
|--------------|--------------|
| Privado + Convite + Sem Landing | Pular landing page, sem Google Analytics, robots.txt com `Disallow: /`, entrada pelo `/login` |
| Multiplos usuarios | Sistema de convites por email, roles hierarquicas, gestao de membros |

---

## 3. Requisitos Funcionais (Por Fase)

### Fase 1: Foundation (Auth + Infra + iFood Connection)
**Dependencias**: Nenhuma
**Outcome Testavel**: Usuario logado consegue conectar conta iFood e ver lista de restaurantes vinculados

| ID | Requisito | Prioridade | Criterios de Aceite |
|----|-----------|------------|---------------------|
| FR-101 | Autenticacao por email/senha | HIGH | - Login com email + senha / - Senha com requisitos minimos (8 chars, 1 maiuscula, 1 numero) / - Recuperacao de senha por email (Resend) / - Sessao persistente com refresh token |
| FR-102 | Role admin com acesso total | HIGH | - Role "admin" built-in com acesso irrestrito a todas as funcionalidades / - Admin pode criar, editar e remover roles customizadas / - Pelo menos 1 admin obrigatorio no sistema |
| FR-103 | Roles customizadas com acesso granular | HIGH | - Admin cria roles com nome e descricao / - Permissoes granulares por entidade da aplicacao (restaurantes, relatorios, avaliacoes, chamados, financeiro, cardapio, usuarios) / - Controle CRUD por entidade (Create, Read, Update, Delete) / - Matriz de permissoes editavel na UI / - Role aplicada ao usuario no momento do convite ou alterada depois / - RLS e middleware verificam permissoes em todas as rotas e acoes |
| FR-104 | Convite de usuarios por email | HIGH | - Admin envia convite por email (Resend) / - Link de convite expira em 48h / - Usuario define senha ao aceitar convite / - Admin seleciona role no momento do convite |
| FR-105 | Gestao de membros (CRUD) | HIGH | - Listar membros com role e status / - Ativar/desativar membro / - Alterar role / - Auditoria de todas as mudancas |
| FR-106 | Conectar conta iFood | HIGH | - Fluxo de autenticacao conforme API iFood (OAuth2 ou equivalente) / - Persistir tokens/credenciais com seguranca (Supabase Vault) / - Refresh automatico de token antes de expirar |
| FR-107 | Multi-conta iFood | HIGH | - Conectar mais de uma conta iFood / - Listar contas conectadas com status / - Alternar entre contas / - Desconectar conta (com confirmacao) |
| FR-108 | Listar restaurantes por conta iFood | HIGH | - Ao conectar conta, carregar restaurantes vinculados via API Merchant / - Exibir nome, status, dados basicos / - Selecionar restaurante para operar |
| FR-109 | Modelo de dados base | HIGH | - Tabelas para todas as entidades iFood: merchants, catalogs, orders, events, logistics, reviews, financials, tickets / - Tabelas para RBAC: roles, permissions, role_permissions, user_roles / - RLS habilitado em todas / - Relacao: ifood_account -> restaurants -> entidades |
| FR-110 | Engine de coleta de dados | HIGH | - Coleta diaria automatizada por restaurante / - Preferir webhooks/eventos iFood quando disponiveis / - Fallback: polling agendado / - Idempotencia (nao duplicar registros) / - Log de cada execucao (sucesso/falha/itens coletados) |
| FR-111 | Armazenamento de historico | HIGH | - Historico diario por restaurante / - Snapshots de metricas preservados / - Dados suficientes para gerar relatorio sem chamar API novamente |
| FR-112 | Dark mode | MEDIUM | - Disponivel desde o lancamento / - Light mode como padrao / - Toggle para dark mode acessivel no header/menu / - Persistir preferencia do usuario no banco |
| FR-113 | Estrutura PWA base | HIGH | - Service worker registrado / - Manifest.json configurado / - Instalavel (add to home screen) |
| FR-114 | Forced update | HIGH | - Ao detectar nova versao do app, bloquear uso / - Modal obrigatorio pedindo refresh/reload / - Nao permitir continuar com versao antiga |

### Fase 2: Performance, Funil e Relatorios (Core MVP)
**Dependencias**: Fase 1 completa
**Outcome Testavel**: Relatorio semanal em PDF gerado automaticamente com dados reais; envio manual com auditoria funcionando

| ID | Requisito | Prioridade | Criterios de Aceite |
|----|-----------|------------|---------------------|
| FR-201 | Snapshot semanal do funil (Seg-Dom) | HIGH | - Capturar por restaurante: Visitas, Visualizacoes, Sacola, Revisao, Concluidos / - Semana atual vs semana anterior / - Diferencas absolutas e percentuais por etapa / - Persistir snapshot no banco |
| FR-202 | Alertas de piora no funil | HIGH | - Alerta automatico quando qualquer etapa piora vs semana anterior / - Alerta visual na UI (cor/icone) / - Historico de alertas preservado |
| FR-203 | Limites operacionais com alertas | HIGH | - Taxa cancelamento: alerta se >2% / - Tempo aberto: alerta se <95% / - Chamados em aberto: alerta se >3% / - Clientes novos vs recorrentes: alerta se >90% novos OU >90% recorrentes / - Mensagem contextual para cada alerta |
| FR-204 | Dashboard de performance por restaurante | HIGH | - Visualizacao do funil com comparativo semanal / - Indicadores de limites operacionais / - Filtro por restaurante e periodo / - Carregamento <3s |
| FR-205 | Geracao automatica de PDF semanal | HIGH | - Gerar 1 PDF por restaurante por semana (Seg-Dom) / - Geracao automatica toda segunda-feira as 06:00 BRT (dados consolidados do domingo) / - Conteudo: Financeiro + Algoritmo + Marketing (somente resultados, sem acoes/metas/estrategia) / - Armazenar PDF + metadados (restaurante, semana, data geracao, hash) |
| FR-206 | Estrutura do PDF — Financeiro | HIGH | - Pedidos / Faturamento / Ticket medio / Novos clientes / Melhor dia / Melhor horario / - Dados da semana (Seg-Dom) / - Observacoes curtas/flags permitidas, sem "o que fazer" |
| FR-207 | Estrutura do PDF — Algoritmo | HIGH | - Visitas / Visualizacoes / Sacolas / Pedidos / Conversao / Cancelamento / Tempo aberto / Chamados / - Comparativo semanal quando aplicavel |
| FR-208 | Estrutura do PDF — Marketing | HIGH | - Pedidos com promocao / Investimento / Receita gerada / ROAS |
| FR-209 | Envio manual de relatorio | HIGH | - Botao "Enviar" no relatorio gerado / - Modal de confirmacao obrigatorio / - Selecionar canais: Email (Resend) e/ou WhatsApp (Uazapi) / - Envio em <10s |
| FR-210 | Auditoria de envio de relatorio | HIGH | - Registrar: quem enviou, quando, canais selecionados, status por canal, erros / - Visualizar historico de envios por relatorio |
| FR-211 | Estados do relatorio | HIGH | - Generated -> Sending -> Sent / Failed / - Transicoes com timestamp / - Failed permite retry / - UI exibe estado atual e historico |
| FR-212 | Conteudo interno vinculado ao relatorio | HIGH | - Insights e recomendacoes internas (texto livre) / - Nao vai no PDF / - Vinculado a restaurante + semana / - Editavel pelo time |
| FR-213 | Acoes com meta clara | HIGH | - Lista de acoes vinculadas ao relatorio/semana/restaurante / - Campos: titulo, descricao, meta, action_type (enum), payload (JSON), target / - Estados: Planned -> Done ou Discarded |
| FR-214 | Acao marcada como Done | HIGH | - Exigir evidencia (texto) + timestamp / - Opcional: anexos/links / - Registrar usuario e data/hora |
| FR-215 | Acao marcada como Discarded | HIGH | - Exigir motivo (texto curto) + timestamp / - Registrar usuario e data/hora |
| FR-216 | Auditoria completa de acoes | HIGH | - Logar: usuario, data/hora, contexto (restaurante/semana), origem (manual/sugerida) / - Historico imutavel / - Visivel na UI |
| FR-217 | Checklist de execucao | MEDIUM | - Checklist da semana atual e proxima / - Vinculado ao relatorio / - Itens marcaveis / - Auditoria de quem marcou e quando |
| FR-218 | Evidencias (antes/depois) | MEDIUM | - Upload de imagens/arquivos para evidencia / - Links externos / - Vinculado a acao ou relatorio / - Armazenamento no Supabase Storage |
| FR-219 | Rastreabilidade 1:1 completa | HIGH | - Cadeia: Snapshot/Metrica -> Insight -> Recomendacao (opcional) -> Acao -> Status -> Evidencia / - Navegavel na UI / - Auditoria em cada etapa |

### Fase 3: Comunicacao e Respostas Automaticas
**Dependencias**: Fase 1 completa (pode rodar paralelo com Fase 2 apos Fase 1)
**Outcome Testavel**: Avaliacoes listadas com auto-resposta (IA/Template) funcionando; chamados listados com resposta funcionando; controles global/individual ativos

| ID | Requisito | Prioridade | Criterios de Aceite |
|----|-----------|------------|---------------------|
| FR-301 | Coleta de avaliacoes iFood | HIGH | - Coletar avaliacoes e motivos via API Review / - Armazenar no banco com historico / - Exibir na UI com nota, texto, data, restaurante |
| FR-302 | Auto-resposta a avaliacoes — modo Template | HIGH | - Editor simples de template + preview / - Placeholders: Contato, Restaurante, Pedido (conforme disponibilidade API) / - Template salvo por restaurante |
| FR-303 | Auto-resposta a avaliacoes — modo IA | HIGH | - OpenAI texto para gerar resposta / - Positiva: agradecer / - Negativa: NUNCA assumir culpa, dizer que vai avaliar, finalizar bem / - Prompt padrao configuravel |
| FR-304 | Controle de auto-resposta — Global ON/OFF | HIGH | - Toggle global que aplica em massa para todos os restaurantes / - Exigir confirmacao em modal / - Nao e master override: e acao em massa |
| FR-305 | Controle de auto-resposta — Global IA/Template | HIGH | - Toggle global de modo que aplica em massa / - Exigir confirmacao em modal |
| FR-306 | Controle de auto-resposta — Individual ON/OFF | HIGH | - Toggle por restaurante / - Muda apenas aquele restaurante / - Exigir confirmacao em modal |
| FR-307 | Controle de auto-resposta — Individual IA/Template | HIGH | - Toggle por restaurante / - Muda apenas aquele restaurante |
| FR-308 | Padrao inicial de auto-resposta (avaliacoes) | HIGH | - Comecar OFF para todos os restaurantes / - Modo inicial: Template (mas nao responde porque OFF) |
| FR-309 | Auditoria de avaliacoes | HIGH | - Logar: mudancas de toggles (global/individual), mudancas de modo, mensagens enviadas (conteudo, canal, review_id, pedido_id, timestamp, status, erro) |
| FR-310 | Coleta de chamados/mensagens iFood | HIGH | - Listar mensagens/chamados via API (endpoints conforme documentacao iFood) / - Preferir webhooks quando disponiveis / - Armazenar com historico |
| FR-311 | Auto-resposta a chamados — Template | HIGH | - Menu de respostas padrao / - Editor + preview / - Placeholders conforme API |
| FR-312 | Auto-resposta a chamados — IA | HIGH | - OpenAI texto para gerar resposta contextual / - Prompt padrao configuravel |
| FR-313 | Controles de auto-resposta chamados (mesmo modelo avaliacoes) | HIGH | - Global ON/OFF (massa), Global IA/Template (massa) / - Individual ON/OFF, Individual IA/Template / - Padrao inicial: OFF / - Modais de confirmacao / - Sem master override |
| FR-314 | Auditoria de chamados | HIGH | - Logar: toggles, modos, cada resposta (conteudo, thread_id, chamado_id, timestamp, status, erro) |

### Fase 4: Financeiro e Cardapio
**Dependencias**: Fase 1 completa (pode rodar paralelo com Fases 2 e 3 apos Fase 1)
**Outcome Testavel**: Conciliacao financeira com export funcionando; gestao de imagens com aprovacao e aplicacao no catalogo

| ID | Requisito | Prioridade | Criterios de Aceite |
|----|-----------|------------|---------------------|
| FR-401 | Coleta de dados financeiros iFood | HIGH | - Repasses, taxas, promocoes, estornos, ajustes (taxonomia iFood) / - Armazenar com historico diario / - Idempotente |
| FR-402 | Visualizacao de conciliacao financeira | HIGH | - Total "para mais" e "para menos" / - Breakdown por tipo iFood / - Filtros por restaurante e periodo / - Drilldown por lancamento (quando API permitir) |
| FR-403 | Exportacao financeira — CSV | HIGH | - Exportar dados filtrados em CSV / - Auditoria: quem exportou, filtros, periodo, formato |
| FR-404 | Exportacao financeira — XLS | HIGH | - Exportar dados filtrados em XLS / - Auditoria: quem exportou, filtros, periodo, formato |
| FR-405 | Catalogo — Listar produtos do restaurante | HIGH | - Carregar catalogo via API Catalog / - Exibir: nome, descricao, preco, imagem, categoria, disponibilidade |
| FR-406 | Melhorar imagem existente (Modo 1) | HIGH | - Usa imagem atual + prompt padrao (melhoria profissional) / - Fluxo ASSINCRONO: cria Job, usuario continua navegando / - Ao concluir: item com indicador "Pendente de aprovacao" / - Formato: 1:1 quadrada, alta qualidade |
| FR-407 | Criar imagem a partir de imagem (Modo 2) | HIGH | - Upload de imagem base + prompt padrao/variacao / - Fluxo sincrono ou assincrono conforme tempo / - Preview antes de aplicar |
| FR-408 | Criar imagem a partir da descricao do produto (Modo 3) | HIGH | - Usa descricao atual do produto como base / - Fluxo ASSINCRONO / - Preview antes de aplicar |
| FR-409 | Criar imagem a partir de nova descricao (Modo 4) | HIGH | - Usuario informa nova descricao / - Gera imagem a partir dessa descricao / - Ao aprovar: atualiza descricao E imagem no catalogo |
| FR-410 | Upload direto de imagem (Modo 5) | MEDIUM | - Upload sem IA / - Preview + confirmacao antes de aplicar |
| FR-411 | Workflow de aprovacao de imagem | HIGH | - Toda alteracao (IA ou upload) exige confirmacao / - Preview com botoes: Aprovar/Aplicar e Rejeitar/Cancelar / - Status: Generating -> ReadyForApproval -> Approved -> AppliedToCatalog ou Rejected/Archived |
| FR-412 | Job queue para geracao assincrona de imagens | HIGH | - Jobs de geracao para modos 1 e 3 / - Usuario pode continuar navegando / - Notificacao (visual na UI) quando job concluir / - Retry em caso de falha |
| FR-413 | Aplicar imagem no catalogo iFood | HIGH | - Ao aprovar, enviar imagem via API Catalog / - Registrar resultado (sucesso/falha) / - Armazenar antes/depois |
| FR-414 | Auditoria de imagens | HIGH | - Logar: quem disparou, modo, timestamps, prompt/base usado, quem aprovou, quando aprovou, quando aplicou no catalogo, resultado, antes/depois (referencias de assets) |
| FR-415 | Prompt base padrao para melhoria de imagem | HIGH | - Prompt conforme especificado no INPUT.md / - Configuravel pelo admin / - Foco em: manter fidelidade ao produto, melhorar apresentacao profissional |

### Fase 5: Admin, Notificacoes e Polish
**Dependencias**: Fases 1-4 completas
**Outcome Testavel**: Admin panel completo; notificacoes enviadas; help center acessivel; app 100% funcional com dark mode e PWA

| ID | Requisito | Prioridade | Criterios de Aceite |
|----|-----------|------------|---------------------|
| FR-501 | Admin Panel — Dashboard | HIGH | - Visao geral: usuarios, contas iFood, restaurantes, relatorios / - Metricas de uso do sistema |
| FR-502 | Admin Panel — Gestao de usuarios e roles | HIGH | - CRUD de usuarios / - CRUD de roles customizadas / - Matriz de permissoes por role (entidade x CRUD) / - Atribuir/alterar role de usuario / - Ativar/desativar membro / - Historico de acoes |
| FR-503 | Admin Panel — Criacao de notificacoes | HIGH | - Admin cria notificacao para usuarios / - Canais: email (Resend) e WhatsApp (Uazapi) / - Selecionar destinatarios / - Auditoria de envio |
| FR-504 | Admin Panel — Visualizador de audit logs | HIGH | - Consultar logs de auditoria do sistema / - Filtros: usuario, acao, data, modulo / - Exportavel |
| FR-505 | Central de Ajuda interna | MEDIUM | - Acessivel apenas por usuarios autenticados / - Conteudo de ajuda por modulo / - Pesquisavel |
| FR-506 | PWA — Experiencia offline/conexao ruim | MEDIUM | - Cache de dados criticos / - Feedback visual quando offline / - Sincronizar ao reconectar |
| FR-507 | Onboarding de primeiro acesso | MEDIUM | - Guia rapido ao primeiro login / - Explicar modulos principais / - Dispensavel |
| FR-508 | Retry e visibilidade de erros em integracoes | HIGH | - Todas integracoes externas (iFood, OpenAI, Resend, Uazapi) com retry automatico / - Log de tentativas / - UI exibindo status de erro quando houver falha / - Admin pode ver erros e retentar manualmente |

---

## 4. Non-Goals Explicitos

### Nao implementar nesta versao
- [x] App mobile nativo — apenas web responsivo + PWA
- [x] Chat interno entre membros — comunicacao e via WhatsApp/email externo
- [x] BI generico ou dashboard customizavel — dashboards sao fixos conforme playbook GT
- [x] Integracao com plataformas alem do iFood (Rappi, Uber Eats, etc.) — apenas iFood na v1
- [x] Execucao automatica de acoes via API iFood — v1 apenas registra e rastreia, preparando modelo de dados para automacao futura
- [x] Edicao do PDF no sistema — PDF e gerado automaticamente, sem edicao
- [x] Push notifications — apenas email e WhatsApp
- [x] Notificacoes internas (sino/bell) — apenas email e WhatsApp
- [x] AI Support Chat — nao nesta versao
- [x] Barras promocionais — nao nesta versao
- [x] Limites de uso — nao nesta versao
- [x] Self-service signup — apenas convite

### Nao usar
- [x] ERP/POS — GTBI nao substitui operacao do restaurante
- [x] Marketplace — nao e plataforma de venda

### Limites de escopo
- [x] Apenas idioma pt-BR na interface
- [x] Dados armazenados apenas no Brasil (LGPD)
- [x] V1 integra apenas: iFood + OpenAI (text + image) + Resend + Uazapi

---

## 5. Especificacoes Tecnicas

### Stack Obrigatoria
- **Frontend**: React 19 + Vite + TypeScript strict + shadcn/ui + Tailwind CSS
- **State Management**: React Query (server state) + Zustand (client state)
- **Validacao**: Zod (runtime validation + type inference)
- **Backend**: Supabase (Auth, Database/PostgreSQL, Edge Functions, Storage)
- **Deploy**: Vercel (frontend) + Supabase Cloud (backend)
- **Testes**: Vitest + Testing Library

### Estrutura de Pastas
Ver CLAUDE.md para estrutura completa (Clean Architecture + Feature-Sliced Design).

### Integracoes Externas

| Servico | Proposito | Credenciais | Documentacao |
|---------|-----------|-------------|--------------|
| iFood API — Merchant | Dados de lojas/restaurantes | OAuth2 tokens (Supabase Vault) | https://developer.ifood.com.br/pt-BR/docs/guides/modules/merchant/workflow/?category=FOOD |
| iFood API — Catalog | Itens, precos, disponibilidade, categorias, imagens | Mesmo token | https://developer.ifood.com.br/pt-BR/docs/guides/modules/catalog/Intro/?category=FOOD |
| iFood API — Order | Pedidos, itens, status, timestamps | Mesmo token | https://developer.ifood.com.br/pt-BR/docs/guides/modules/order/workflow/?category=FOOD |
| iFood API — Events | Eventos operacionais | Mesmo token | https://developer.ifood.com.br/pt-BR/docs/guides/modules/events/intro/?category=FOOD |
| iFood API — Logistics | Entrega, status, tempos | Mesmo token | https://developer.ifood.com.br/pt-BR/docs/guides/modules/logistics/workflow/?category=FOOD |
| iFood API — Shipping | Envio | Mesmo token | https://developer.ifood.com.br/pt-BR/docs/guides/modules/shipping/intro/?category=FOOD |
| iFood API — Review | Avaliacoes e respostas | Mesmo token | https://developer.ifood.com.br/pt-BR/docs/guides/modules/review/intro/?category=FOOD |
| iFood API — Financial | Repasses, taxas, estornos | Mesmo token | https://developer.ifood.com.br/pt-BR/docs/guides/modules/financial/intro/?category=FOOD |
| OpenAI — Text | Respostas IA (avaliacoes, chamados) | OPENAI_API_KEY | - |
| OpenAI — gpt-image-1 | Geracao/edicao de imagens de produtos | OPENAI_API_KEY | - |
| Resend | Email transacional (convites, relatorios, notificacoes) | RESEND_API_KEY | - |
| Uazapi | WhatsApp (envio de PDF, notificacoes) | UAZAPI_SERVER_URL + UAZAPI_ADMIN_TOKEN | - |

---

## 6. Rastreamento de Fases

| # | Fase | Status | Depende | Agentes | Condicao |
|---|------|--------|---------|---------|----------|
| 0 | Setup (Design System) | pending | - | Design System Generator | Sempre |
| 1 | Frontend | pending | 0 | Frontend Agent, Test Generator, Code Reviewer | Sempre |
| 2 | Backend | pending | 0 | Database Agent, Code Executor, Test Generator | Sempre |
| 3 | Integracao | pending | 1, 2 | Integration Agent, Test Generator (E2E) | Sempre |
| 4 | Admin Panel | pending | 1 | Admin Panel Agent | Sempre (sem landing page — projeto privado) |
| Final | Producao | pending | 3, 4 | Deploy Agent, Notification Agent | Sempre |

**Notas**:
- Projeto privado/interno: NAO gerar landing page, NAO configurar Google Analytics
- robots.txt com `Disallow: /`
- Admin Panel SEMPRE gerado
- Legal Generator NAO necessario (sistema interno)

---

## 7. Requisitos Nao-Funcionais

### Performance
- [x] Tempo de carregamento inicial: <3s
- [x] Time to Interactive: <5s
- [x] API response time: <500ms (p95)
- [x] Geracao de PDF: <30s por restaurante
- [x] Lighthouse PWA score: >90
- [x] Funcional em conexoes ruins (3G): cache agressivo, feedback visual

### Seguranca
- [x] RLS em todas as tabelas (isolamento por organizacao)
- [x] HTTPS obrigatorio
- [x] Tokens iFood em Supabase Vault (nunca em .env do frontend)
- [x] Rate limiting em Edge Functions
- [x] Dados no Brasil (LGPD compliance)
- [x] Audit logs imutaveis para todas as acoes criticas
- [x] OWASP Top 10 considerado

### Acessibilidade
- [x] WCAG 2.1 AA compliance
- [x] Navegacao por teclado
- [x] Screen reader compativel
- [x] Dark mode desde o lancamento

### Resiliencia
- [x] Retry automatico em integracoes externas (iFood, OpenAI, Resend, Uazapi)
- [x] Logs de tentativas e erros visiveis na UI
- [x] Idempotencia na coleta de dados (sem duplicacao)
- [x] Forced update: bloquear uso em versao antiga

---

## 8. Glossario

| Termo | Definicao |
|-------|-----------|
| Conta iFood | Conta de acesso a API iFood que gerencia um ou mais restaurantes |
| Restaurante | Estabelecimento vinculado a uma conta iFood (merchant) |
| Snapshot | Fotografia semanal (Seg-Dom) das metricas de um restaurante |
| Funil | Sequencia: Visitas -> Visualizacoes -> Sacola -> Revisao -> Concluidos |
| Acao | Tarefa registrada pelo time GT vinculada a um insight/metrica |
| Evidencia | Comprovacao (texto, imagem, link) de que uma acao foi executada |
| Relatorio | PDF semanal gerado automaticamente com resultados do restaurante |
| Auto-resposta | Resposta automatica a avaliacoes ou chamados (via IA ou Template) |
| Job | Tarefa assincrona (ex: geracao de imagem) executada em background |
| Playbook GT | Metodologia da GT Consultoria para analise e acao em restaurantes iFood |
| Role | Papel atribuido a um usuario que define suas permissoes no sistema |
| Permissao | Acesso granular a uma entidade (CRUD) atribuido a uma role |
| RBAC | Role-Based Access Control — modelo de controle de acesso baseado em roles |
