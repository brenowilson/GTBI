# Briefing do Projeto (INPUT.md)

## Nome
GTBI

## Idioma da Interface
- [x] Portugues (pt-BR)
- [ ] Ingles (en-US)
- [ ] Espanhol (es)
- [ ] Outro: _______________

## Em uma frase
Sistema interno da GT Consultoria que conecta em contas iFood (gestoras de múltiplos restaurantes), coleta e armazena dados (histórico diário), acelera análise e decisão do time, e gera relatórios semanais em PDF para envio por email e WhatsApp (envio manual com auditoria).

---

# Tipo de Projeto

## Acesso ao Sistema
- [ ] Publico (qualquer pessoa pode se cadastrar)
- [x] Privado/Interno (apenas usuarios convidados)

## Cadastro de Usuarios
- [ ] Self-service (usuarios se cadastram sozinhos via landing page)
- [x] Apenas convite (usuarios sao convidados por admins/membros)

## Landing Page
- [ ] Sim (pagina de marketing com SEO)
- [x] Nao (ponto de entrada e a tela de login)

## Multiplos Usuarios/Organizacoes
- [x] Sim (multiplos usuarios internos GT Consultoria, com roles/permissoes)
- [ ] Nao

Notas:
- Convite de usuários SEMPRE por email
- Roles/permissoes e gestao de membros sao do sistema (GT Consultoria), nao dos restaurantes

---

# Estrutura de Contas iFood (Muito Importante)

- O sistema conecta em **contas iFood que gerenciam múltiplos restaurantes**
- Deve permitir:
  - Conectar mais de uma conta iFood (multi-conta)
  - Alternar entre contas iFood conectadas
  - Ao conectar uma conta iFood, carregar/listar os restaurantes vinculados
  - Selecionar restaurante para analisar dados, executar ações e gerar relatórios

Autenticação:
- Persistir tokens/credenciais conforme padrão da API iFood
- Fluxo exato de autenticação permitido pela API do iFood (agentes devem verificar e implementar)

Modelagem:
- Conta iFood -> Restaurantes -> Entidades
  - Merchant (dados de loja)
  - Catalog (itens, preços, disponibilidade, categorias, imagens)
  - Orders (pedidos, itens, status, timestamps)
  - Events (eventos operacionais para compor histórico)
  - Logistics/Shipping (entrega, status, tempos)
  - Review (avaliações e respostas)
  - Financial (repasses, taxas, promoções, estornos, ajustes)
  - Atendimento/mensagens/chamados (onde a API permitir)

---

# Problema
A GT Consultoria já tem processo claro.
O objetivo do GTBI não é “inventar” consultoria: é acelerar leitura do cenário, reduzir tempo em análise operacional e deixar o time focar em ações (com rastreabilidade e auditoria) e validação posterior por métricas e snapshots.

---

# Para quem
- Uso 100% interno (GT Consultoria)
- Cliente final recebe relatório (PDF) e aprova mudanças via WhatsApp (fora do sistema, por enquanto)

---

# Padrões e Alertas (Obrigatório)

## Funil de performance (etapas)
- Visitas
- Visualizações
- Sacola
- Revisão
- Concluídos (Pedido)

Para cada etapa:
- Comparativo Semana Atual vs Semana Anterior (abs e %)
- Alertas quando piora
- Vincular com rastreabilidade 1:1:
  Snapshot/Métrica -> Insight -> (opcional) Recomendação -> Ação -> Status -> Evidência (antes/depois)

## Limites operacionais (alertas)
- Taxa de cancelamento: aceitável até 2%
- Tempo aberto: mínimo 95%
- Chamados em aberto: aceitável até 3%
- Clientes novos x recorrentes: ideal 50% / 50%
  - Se >90% novos: problema de produto (qualidade)
  - Se >90% recorrentes: pouca exposição (ofertas/promo)

---

# Relatórios Semanais (Obrigatório)

## Canais
- Email (PDF anexado)
- WhatsApp (PDF enviado via Uazapi)

## Frequência e Janela
- Semanal
- Sempre Seg -> Dom

## Geração vs Envio (Obrigatório)
- **Geração 100% automática**
  - Sempre gera um PDF por restaurante para cada semana (Seg->Dom)
  - Não existe edição do PDF no sistema
  - O sistema deve guardar a versão gerada (arquivo + metadados)
- **Envio manual**
  - Exige clique em botão “Enviar”
  - Exige confirmação em modal
  - Auditoria obrigatória do envio (quem enviou, quando, canais, status, erros)

## Estados do Relatório (Obrigatório)
- Generated (gerado automaticamente)
- Sending (envio em andamento)
- Sent (enviado com sucesso)
- Failed (falha no envio; precisa retry)

## Estrutura do PDF (SOMENTE CLIENTE) — padrão
O PDF do cliente contém APENAS dados/resultados, seguindo o modelo padrão:

1) **Financeiro** (resultados)
- Pedidos
- Faturamento
- Ticket médio
- Novos clientes
- Melhor dia
- Melhor horário

2) **Algoritmo** (resultados)
- Visitas
- Visualizações
- Sacolas
- Pedidos
- Conversão
- Cancelamento
- Tempo aberto
- Chamados

3) **Marketing** (promoções / resultados)
- Pedidos com promoção
- Investimento
- Receita gerada
- ROAS

Regras do PDF (Obrigatório):
- Vai apenas **resultados**
- Pode conter, no máximo, observações curtas/flags de leitura do número (sem “o que fazer”)
- **Não incluir ações**
- **Não incluir meta clara**
- **Não incluir estratégia GT / plano / checklist**

## Conteúdo Interno (NÃO vai no PDF)
Deve aparecer na UI e estar atrelado ao relatório semanal (por restaurante e semana):
- Insights e recomendações internas
- Lista de ações (com meta clara)
- Checklist de execução da semana e da próxima
- Evidências (antes/depois), links e anexos
- Auditoria completa (quem fez o quê, quando)

### Ações — estados (Obrigatório)
Cada ação deve poder ser marcada como:
- Planned (planejada)
- Done (feita)
- Discarded (descartada)

Regras (Obrigatório):
- Ao marcar Done:
  - registrar evidência (texto) e timestamp
  - opcional: anexos/links
- Ao marcar Discarded:
  - exigir motivo (texto curto) e timestamp
- Tudo com auditoria:
  - usuário (quem fez), data/hora, contexto (restaurante/semana), origem (manual/sugerida)

Preparação para automação futura (Obrigatório):
- Cada ação deve ter:
  - `action_type` (tipo padronizado / enum)
  - `payload` (JSON com parâmetros)
  - `target` (o que será afetado: catalog item, promotion, setting, etc.)
- Objetivo: futuramente executar ações via API iFood (quando aplicável) sem mudar o modelo de dados.

---

# Funcionalidades principais (Módulos)

## 1) Performance / Funil (playbooks GT)
Fonte: desempenho/funil do iFood.

Snapshots semanais (Seg -> Dom) por restaurante:
- Semana atual vs anterior
- Diferenças abs e % por etapa
- Alertas quando piora
- Vínculo com ações e evidências (interno)

Relatório semanal (PDF - cliente):
- Resultados: Financeiro + Algoritmo + Marketing

UI interna (fora do PDF):
- Insights
- Ações com meta clara
- Done/Discarded
- Evidências e auditoria

## 2) Avaliações (auto resposta + IA OU template)
Objetivo: responder avaliações via iFood com controle total e auditoria.

Coleta:
- Coletar avaliações e motivos via iFood

Resposta:
- Onde a API permitir responder:
  - Modo Template (mensagem padrão editável)
  - Modo IA (OpenAI texto)

Regras de conteúdo (IA):
- Avaliação positiva: agradecer
- Avaliação negativa: NUNCA assumir culpa; sempre dizer que vai avaliar o caso e finalizar bem

Controles (Obrigatório) — GLOBAL e por RESTAURANTE
A resposta automática tem 2 dimensões separadas:
1) Auto-responder ON/OFF
2) Modo de resposta: IA ou Template

Regras de aplicação:
- Global ON/OFF:
  - ao mudar, **aplica em massa** para todos os restaurantes
- Global IA/Template:
  - ao mudar, **aplica em massa** para todos os restaurantes
- Individual ON/OFF:
  - muda apenas aquele restaurante
- Individual IA/Template:
  - muda apenas aquele restaurante
- Não existe “master override”: global é ação em massa, não é proteção.

Padrão inicial (Obrigatório):
- Auto-responder começa **OFF** para todos os restaurantes
- Modo inicial recomendado: Template (mas não responde porque está OFF)

UX (Obrigatório):
- Mudanças globais e individuais exigem confirmação em modal (“Você tem certeza?”)
- Template:
  - editor simples + preview
  - placeholders (agentes verificam disponibilidade na API iFood):
    - Contato
    - Restaurante
    - Pedido

Auditoria (Obrigatório):
- Logar:
  - mudanças de toggles (global e individual)
  - mudanças de modo (IA/Template)
  - mensagens enviadas (conteúdo, canal, review_id/pedido_id se existir, timestamp, status, erro)

## 3) Conciliação financeira
Objetivo: dar visibilidade clara de “para mais / para menos” e composição.

Coleta:
- Repasses, taxas, promoções, estornos, ajustes (taxonomia iFood)

Visualização geral:
- Total “para mais” e total “para menos”
- Breakdown por tipo iFood
- Filtros por restaurante e período
- Drilldown por lançamento (quando API permitir granularidade)

Exportação:
- CSV
- XLS

Auditoria (Obrigatório):
- Logar exportações (quem exportou, filtros, período, formato)

## 4) Atendimento / Chamados / Mensagens (auto resposta + IA OU template)
Objetivo: responder mensagens/chamados do iFood com controle e auditoria.

Coleta:
- Listar mensagens/chamados onde API permitir
- Preferir eventos/webhooks quando disponíveis

Resposta:
- Onde houver endpoint de resposta:
  - Templates (menu de respostas)
  - IA automática (OpenAI texto)

Controles (Obrigatório) — mesmo modelo do módulo 2
Dimensões:
1) Auto-responder ON/OFF
2) Modo: IA ou Template

Aplicação:
- Global ON/OFF = aplica em massa
- Global IA/Template = aplica em massa
- Individual = muda apenas o restaurante
- Sem master override

Padrão inicial (Obrigatório):
- Auto-responder começa **OFF** para todos os restaurantes

UX (Obrigatório):
- Mudanças globais e individuais exigem confirmação em modal
- Template:
  - editor + preview
  - placeholders se existirem na API

Auditoria (Obrigatório):
- Logar:
  - toggles, modos
  - cada resposta enviada (conteúdo, thread_id/chamado_id, timestamp, status, erro)

Agentes devem verificar na documentação iFood:
- Quais canais existem
- Quais endpoints permitem listar e responder
- Quais eventos/webhooks existem para captar mensagens/chamados

## 5) Cardápio — Gestão de Imagens (OpenAI gpt-image-1)
Objetivo: melhorar imagem de produto sem “virar outro produto”, com aprovação obrigatória e auditoria.

Modelo:
- OpenAI gpt-image-1 (geração/edição de imagem)
- Centralizar custos e qualidade em OpenAI

5 formas ao alterar imagem do produto:
1) Melhorar imagem do produto
   - Usa imagem existente + prompt padrão
   - **ASSÍNCRONO**
2) Criar nova imagem a partir de uma imagem
   - Usuário faz upload de imagem base + prompt padrão (ou variação)
3) Criar nova imagem a partir da descrição do produto
   - Usa descrição atual do produto como base
   - **ASSÍNCRONO**
4) Criar nova imagem a partir de uma nova descrição
   - Usuário informa nova descrição
   - Ao aprovar: **atualiza descrição + imagem** no produto
5) Upload de imagem (sem IA)
   - Upload direto e aplica (com confirmação)

Regras de aprovação (Obrigatório):
- Toda alteração (IA ou upload) exige confirmação antes de aplicar no catálogo:
  - Preview + botões: Aprovar/Aplicar e Rejeitar/Cancelar
- Para os fluxos assíncronos (1 e 3):
  - Criar Job de geração
  - Usuário pode continuar navegando
  - Ao finalizar: item fica com indicador “Pendente de aprovação” no contexto do produto

Status de imagem (Obrigatório):
- Generating -> ReadyForApproval -> Approved -> AppliedToCatalog -> Rejected/Archived

Auditoria (Obrigatório):
- Logar:
  - quem disparou, modo, timestamps
  - prompt/base usado (ou hash), inputs (referência da imagem/descrição)
  - quem aprovou, quando aprovou
  - quando aplicou no catálogo (e resultado)
  - antes/depois (referência de assets)

Formato (Obrigatório):
- Entregar sempre em proporção 1:1 (quadrada), alta qualidade

Prompt base (padrão de melhoria / sem trocar produto):
"Você é especialista em edição de fotos de comida de restaurante (lanches, pratos principais, pizzas, sobremesas etc).
Preciso que melhore a imagem do produto de comida anexado. A ideia é ele ser exibido num catálogo de forma profissional.
Você deve identificar os ingredientes e a composição visível na foto e reorganizar/apresentar o produto de forma mais apetitosa e vendável (como fotos de catálogo profissional), sem perder os aspectos físicos do produto original. Não pode parecer outro produto.
Regras:
- Remover bagunça visual (migalhas, manchas, fundo poluído) e destacar o produto.
- Organizar ingredientes e camadas de forma clara, mantendo fidelidade ao original.
- Melhorar luz, contraste, nitidez e cores de forma realista.
- Manter textura e imperfeições naturais do produto (sem 'plástico').
- Fundo limpo e discreto (preferencialmente neutro) e foco total no produto.
- Entregar em proporção 1:1 (imagem quadrada), alta qualidade."

---

# Armazenamento e Histórico (Obrigatório)

## Princípio
- Histórico é diário
- Armazenar tudo necessário para reduzir dependência de chamadas na API
- Preferência: webhooks/eventos do iFood quando disponíveis (agentes devem verificar e implementar)
- Manter consistência e idempotência (evitar duplicar eventos/pedidos)

## Deve armazenar (por restaurante)
- Merchant / dados de loja
- Catalog (itens, preços, disponibilidade, categorias, imagens)
- Orders (pedidos, itens, status, timestamps)
- Events (eventos operacionais para compor histórico)
- Logistics / Shipping (entrega, status, tempos)
- Review (avaliações e respostas)
- Financial (repasses, taxas, estornos, ajustes, promoções)
- Atendimento/mensagens/chamados (quando API permitir)

## Armazenamento de PDFs e Assets
- PDFs gerados: armazenar arquivo + metadados (restaurante, semana, data de geração, hash/versão)
- Imagens de produto (antes/depois): armazenar referências e versões para auditoria

---

# App / Plataforma (Obrigatório)

- Web **responsivo** (mobile-first)
- Suporte a **PWA**:
  - instalável (“download” / add to home screen)
  - boa experiência em conexões ruins
- Atualização: **FORÇAR update quando o código mudar**
  - comportamento: ao detectar nova versão, bloquear uso e pedir refresh/reload

---

# O que NAO e
- [x] Nao e um ERP/POS completo
- [x] Nao e um marketplace
- [x] Nao substitui a operacao do restaurante
- [x] Nao e BI generico (foco em acao e rotina)
- [x] V1 integra: iFood + OpenAI (text + image) + Resend + Uazapi

---

# Restricoes
- Dados sempre no Brasil (LGPD/compliance)
- Dark Mode desde o lançamento
- Auditoria de logs (quem fez o quê, quando)
- Performance boa em conexões ruins

---

# Integracoes Externas

## iFood (Agentes devem verificar e implementar)
- Merchant: https://developer.ifood.com.br/pt-BR/docs/guides/modules/merchant/workflow/?category=FOOD
- Catalog: https://developer.ifood.com.br/pt-BR/docs/guides/modules/catalog/Intro/?category=FOOD
- Order: https://developer.ifood.com.br/pt-BR/docs/guides/modules/order/workflow/?category=FOOD
- Events: https://developer.ifood.com.br/pt-BR/docs/guides/modules/events/intro/?category=FOOD
- Logistics: https://developer.ifood.com.br/pt-BR/docs/guides/modules/logistics/workflow/?category=FOOD
- Shipping: https://developer.ifood.com.br/pt-BR/docs/guides/modules/shipping/intro/?category=FOOD
- Review: https://developer.ifood.com.br/pt-BR/docs/guides/modules/review/intro/?category=FOOD
- Financial: https://developer.ifood.com.br/pt-BR/docs/guides/modules/financial/intro/?category=FOOD

## WhatsApp
- Uazapi (numero da GT Consultoria)
- Envio de PDF (relatório) + mensagens manuais

## Email Transacional
- Resend

## IA
- OpenAI (textos/respostas)
- OpenAI gpt-image-1 (imagens)

---

# Central de Ajuda
- Interna (apenas autenticados)

---

# Funcionalidades Padrao do Sistema

## AI Support Chat
- [x] Nao

## Sistema de Notificacoes
Canais:
- [x] Email
- [x] WhatsApp
- [ ] Internas
- [ ] Push

## Limites de Uso
- [x] Nao (neste momento)

## Barras Promocionais (Admin)
- [x] Nao

## Criacao de Notificacoes (Admin)
- [x] Sim (email e WhatsApp)

---

# Sucesso significa
- Relatório semanal em PDF e ações do time relacionadas ao relatório gerados automaticamente, sem fricção
- Envio manual (1 clique + confirmação) funcionando com auditoria completa
- PDF do cliente seguindo o padrão: Financeiro + Algoritmo + Marketing (somente resultados)
- UI interna ligada ao relatório exibindo:
  - ações com meta clara
  - capacidade de marcar Done/Discarded
  - evidências e auditoria
  - preparo para automação futura via action_type + payload
- Snapshots semanais do funil (Seg-Dom) com evolução clara
- Respostas (avalições/chamados) com ON/OFF + IA/Template, default OFF, com auditoria
- PWA instalável + web responsivo + update forçado quando código mudar
- Integrações (iFood, Resend, Uazapi, OpenAI) funcionando sem falhas de comunicação
  - com retry, logs e visibilidade de erro quando houver falha
