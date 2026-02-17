# Briefing do Projeto

## Nome
TaskFlow

## Idioma da Interface
- [x] Portugues (pt-BR)
- [ ] Ingles (en-US)
- [ ] Espanhol (es)
- [ ] Outro: _______________

## Em uma frase
App de gerenciamento de tarefas simples para times pequenos

## Tipo de Projeto

### Acesso ao Sistema
- [ ] Publico (qualquer pessoa pode se cadastrar)
- [x] Privado/Interno (apenas usuarios convidados)

### Cadastro de Usuarios
- [ ] Self-service (usuarios se cadastram sozinhos via landing page)
- [x] Apenas convite (usuarios sao convidados por admins/membros)

### Landing Page
- [ ] Sim (pagina de marketing com SEO)
- [x] Nao (ponto de entrada e a tela de login)

### Multiplos Usuarios/Organizacoes
- [x] Sim (times/organizacoes com multiplos membros)
- [ ] Nao (apenas usuarios individuais)

**Nota**: Se "Multiplos Usuarios" estiver marcado, o sistema tera:
- Convite de usuarios por email
- Sistema de roles e permissoes
- Gestao de membros da organizacao

## Problema
Times pequenos (startups, agencias, squads) usam ferramentas como Jira ou Asana que sao complexas demais para suas necessidades. Perdem tempo configurando sprints, epics, story points, workflows - quando so precisam de uma lista de tarefas compartilhada.

O resultado: metade do time usa a ferramenta, a outra metade usa post-its ou WhatsApp. A informacao fica fragmentada.

## Para quem
- Times de 2-10 pessoas em startups early-stage
- Pequenas agencias de marketing/design/desenvolvimento
- Squads dentro de empresas maiores que querem algo simples
- Freelancers que trabalham com 2-3 clientes simultaneamente

## Funcionalidades principais
- [x] Criar tarefas com titulo, descricao e prazo
- [x] Atribuir tarefas a membros do time
- [x] Organizar tarefas em projetos/boards
- [x] Marcar tarefas como feitas
- [x] Ver todas as tarefas do time em um dashboard
- [x] Receber notificacoes quando tarefas sao atribuidas ou atualizadas
- [x] Comentar em tarefas

## O que NAO e
- [x] Nao e um Jira - nao tera sprints, epics, story points, velocidade
- [x] Nao e um Notion - nao tera docs, wikis, databases customizaveis
- [x] Nao tera app mobile nativo (apenas web responsivo)
- [x] Nao tera integracao com 50 ferramentas (apenas Slack na v1)
- [x] Nao tera automacoes complexas (apenas notificacoes basicas)
- [x] Nao tera relatorios avancados ou exportacao

## Referencias
- Linear (inspiracao: UI limpa, keyboard-first, velocidade)
- Todoist (inspiracao: simplicidade, foco no essencial)
- Basecamp (inspiracao: comunicacao integrada, opinativo)
- Jira (anti-referencia: muito complexo, configuracao infinita)
- Monday.com (anti-referencia: overload visual, muitas features)

## Diferenciais
- Setup em 2 minutos: criar conta, convidar time, comecar
- Zero configuracao: funciona out-of-the-box sem customizar nada
- Keyboard-first: power users conseguem fazer tudo sem mouse
- Preco justo: gratis ate 5 usuarios, depois $5/usuario/mes

## Restricoes
- Dados no Brasil para compliance LGPD
- Funcionar bem em conexoes lentas (otimizado para Brasil)
- Suportar modo escuro desde o lancamento
- Acessibilidade WCAG 2.1 AA

## Integracoes Externas (opcional)

### Gateway de Pagamento
- [ ] Nenhum (sem pagamentos)
- [x] Stripe
- [ ] Mercado Pago
- [ ] PagSeguro
- [ ] Outro: _______________

### Email Transacional
- [ ] Nenhum
- [x] Resend
- [ ] SendGrid
- [ ] AWS SES
- [ ] Outro: _______________

### Outras Integracoes
- [x] Slack (notificacoes)
- [ ] Google Analytics
- [ ] Sentry (monitoramento de erros)
- [ ] Cloudinary (imagens)
- [ ] OpenAI
- [ ] Outro: _______________

## Central de Ajuda
- [x] Acesso publico (qualquer pessoa pode ver)
- [ ] Acesso autenticado (apenas usuarios logados)

## Sucesso significa
- Usuario cria primeira tarefa em menos de 60 segundos apos cadastro
- 70% dos usuarios ativos na segunda semana (D7 retention)
- NPS > 50
- Time de 5 pessoas consegue usar sem nenhum treinamento
- 1000 times ativos nos primeiros 6 meses

---

## Funcionalidades Padrao do Sistema

#### AI Support Chat
- [ ] Sim (chat de IA para suporte ao usuario)
- [x] Nao

#### Sistema de Notificacoes
Canais de notificacao:
- [x] Internas (sininho no header)
- [x] Email (via Resend/SendGrid)
- [ ] Push (PWA)

#### Limites de Uso
- [x] Sim (alertas de limite 80%/100% + upgrade CTA)
- [ ] Nao

#### Barras Promocionais (Admin)
- [ ] Sim (admin pode criar barras customizaveis)
- [x] Nao

#### Criacao de Notificacoes (Admin)
- [ ] Sim (admin pode enviar notificacoes em massa)
- [x] Nao
