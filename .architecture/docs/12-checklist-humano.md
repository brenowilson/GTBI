# Checklist Humano

Este documento lista TODAS as acoes que um humano precisa fazer antes e depois do fluxo automatizado de geracao de projeto.

---

## ANTES: Pre-requisitos (Uma Vez por Ambiente)

Estas acoes sao feitas UMA VEZ para configurar o ambiente. Depois disso, multiplos projetos podem ser gerados automaticamente.

### 1. Contas e Acessos

| # | Acao | Como Fazer | Resultado Esperado |
|---|------|------------|-------------------|
| 1.1 | Criar conta GitHub | github.com/signup | Username e email confirmado |
| 1.2 | Criar Personal Access Token | GitHub > Settings > Developer settings > Personal access tokens > Generate new token (classic) | Token com scopes: `repo`, `workflow` |
| 1.3 | Criar conta Vercel | vercel.com/signup (conectar com GitHub) | Conta conectada ao GitHub |
| 1.4 | Criar conta Supabase | supabase.com/dashboard | Conta ativa |
| 1.5 | Criar bot Telegram | Falar com @BotFather no Telegram > /newbot | Bot token (formato: `123456:ABC-DEF...`) |
| 1.6 | Obter chat_id do canal | Adicionar bot ao canal, enviar mensagem, acessar `https://api.telegram.org/bot<TOKEN>/getUpdates` | chat_id (ex: `@arqueopsbot` ou numero) |

### 2. Configurar Secrets

Salvar em local seguro (gerenciador de senhas):

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxx
TELEGRAM_BOT_TOKEN=8547591241:AAHmrU360dJVTpAeLrONiLFJ1L0ep0n0gkg
TELEGRAM_CHAT_ID=@arqueopsbot
```

### 3. Configurar Vercel CLI (opcional)

```bash
npm i -g vercel
vercel login
```

### 4. Configurar Supabase CLI (opcional)

```bash
npm i -g supabase
supabase login
```

---

## ANTES: Pre-requisitos (Por Projeto)

Estas acoes sao feitas ANTES de iniciar cada novo projeto.

### 1. Criar Repositorio a partir do Template

| # | Acao | Comando | Resultado |
|---|------|---------|-----------|
| 1.1 | Criar repo a partir do template | `gh repo create meu-projeto --template brenowilson/code-architecture --public --clone` | Repo criado com estrutura completa |
| 1.2 | Entrar na pasta | `cd meu-projeto` | Pronto para configurar |

**Alternativa via GitHub UI:**
1. Acesse github.com/brenowilson/code-architecture
2. Clique em "Use this template" > "Create a new repository"
3. Preencha nome e crie
4. Clone localmente: `git clone https://github.com/SEU_USER/meu-projeto.git`

### 2. Criar Projeto Supabase

| # | Acao | Como | Resultado |
|---|------|------|-----------|
| 2.1 | Criar novo projeto | Supabase Dashboard > New Project | Project URL e anon key |
| 2.2 | Anotar credenciais | Copiar de Settings > API | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

### 3. Criar Projeto Vercel

| # | Acao | Como | Resultado |
|---|------|------|-----------|
| 3.1 | Importar repo | Vercel Dashboard > Add New > Project > Import Git Repository | Projeto criado |
| 3.2 | Configurar variaveis | Settings > Environment Variables | Adicionar todas as envs |

### 4. Configurar Variaveis de Ambiente

No Vercel, adicionar:

```
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx

# App
VITE_APP_URL=https://[projeto].vercel.app

# Apenas para build (nao expor no client)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### 5. Integrações Externas (Se PRD Exigir)

| Servico | Quando Necessario | O que Fazer | Credenciais |
|---------|-------------------|-------------|-------------|
| **Stripe** | Pagamentos | Criar conta, obter API keys | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Resend** | Emails transacionais | Criar conta, verificar dominio | `RESEND_API_KEY`, `EMAIL_FROM` |
| **SendGrid** | Emails em massa | Criar conta, verificar sender | `SENDGRID_API_KEY` |
| **Cloudinary** | Upload de imagens | Criar conta | `CLOUDINARY_URL` |
| **OpenAI** | AI Support Chat | Criar conta, gerar key | `OPENAI_API_KEY` |
| **Google Analytics** | Analytics | Criar property | `VITE_GA_ID` |
| **VAPID Keys** | Push Notifications (PWA) | Gerar par de chaves | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` |

#### Gerando VAPID Keys (Push Notifications)

Se o projeto usa Push Notifications (PWA), voce precisa gerar um par de chaves VAPID:

```bash
# Usando web-push (Node.js)
npx web-push generate-vapid-keys

# Ou online
# https://vapidkeys.com/
```

Resultado:
```
Public Key: BNnAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Adicionar no Vercel/Supabase:
- `VITE_VAPID_PUBLIC_KEY` - Chave publica (exposta no frontend)
- `VAPID_PRIVATE_KEY` - Chave privada (apenas backend/Edge Functions)
- `VAPID_EMAIL` - Email de contato (ex: admin@seudominio.com)

### 6. Preparar Inputs

| # | Acao | Arquivo | Conteudo |
|---|------|---------|----------|
| 6.1 | Criar input do projeto | `INPUT.md` | Copiar de `examples/INPUT-taskflow.md` e preencher |
| 6.2 | Criar brand manual | `BRAND.md` | Copiar de `.architecture/examples/BRAND.md` e preencher |
| 6.3 | Criar pasta de assets | `assets/` | Criar pasta para colocar os assets visuais |

**Sobre o BRAND.md:**
O template (`.architecture/examples/BRAND.md`) permite definir:
- Identidade (nome, tagline, personalidade)
- Cores (background, titulos, paragrafos, destaques, highlights)
- Tipografia (fontes, hierarquia h1/h2/body)
- Bordas, sombras e cards

Campos nao preenchidos sao gerados automaticamente com valores padrao seguindo boas praticas de design e acessibilidade (WCAG AA).

### 7. Fornecer Assets Visuais (OBRIGATORIO)

O humano DEVE fornecer os seguintes assets na pasta `assets/` antes de iniciar o projeto:

#### Assets Obrigatorios

| # | Asset | Formato | Tamanho | Uso |
|---|-------|---------|---------|-----|
| 7.1 | **Logo principal** | PNG ou SVG | 512x512px (min) | Base para gerar todos os icones |
| 7.2 | **Logo com fundo** | PNG | 512x512px | Icone PWA, favicon (fundo solido, nao transparente) |
| 7.3 | **OG Image** | PNG ou JPG | 1200x630px | Compartilhamento em redes sociais |

#### Assets Opcionais (se nao fornecidos, serao gerados automaticamente)

| # | Asset | Formato | Tamanho | Uso |
|---|-------|---------|---------|-----|
| 7.4 | Logo monocromatico dark | PNG/SVG | 512x512px | Versao escura do logo |
| 7.5 | Logo monocromatico light | PNG/SVG | 512x512px | Versao clara do logo |
| 7.6 | Favicon SVG | SVG | Qualquer | Browsers modernos |
| 7.7 | Screenshots do app | PNG | 1280x720, 390x844 | PWA manifest |

#### Estrutura de Pasta

```
assets/
├── logo.png              # 512x512, OBRIGATORIO
├── logo-bg.png           # 512x512 com fundo solido, OBRIGATORIO
├── og-image.png          # 1200x630, OBRIGATORIO
├── logo-dark.png         # Opcional
├── logo-light.png        # Opcional
└── favicon.svg           # Opcional
```

#### O que os Agentes Geram Automaticamente

A partir dos assets fornecidos, os agentes geram:

| Asset Gerado | Fonte | Destino |
|--------------|-------|---------|
| Icones PWA (72-512px) | `logo-bg.png` | `public/icons/` |
| Maskable icon | `logo-bg.png` | `public/icons/maskable-icon-512x512.png` |
| Apple touch icon | `logo-bg.png` | `public/apple-touch-icon.png` |
| Favicon ICO | `logo-bg.png` | `public/favicon.ico` |
| Favicon SVG | `logo.png` ou fornecido | `public/favicon.svg` |
| Splash screens iOS | `logo-bg.png` + cores do BRAND | `public/splash/` |

#### Dicas para Criar Assets

**Logo principal (logo.png)**
- Fundo transparente (PNG) ou vetor (SVG)
- Conteudo centralizado
- Minimo 512x512px para qualidade

**Logo com fundo (logo-bg.png)**
- Mesmo logo, mas com fundo solido (cor primary ou background)
- Necessario para icones que nao suportam transparencia
- Icone deve ocupar ~80% do espaco (deixar margem)

**OG Image (og-image.png)**
- 1200x630px (proporcao 1.91:1)
- Logo + nome do produto + tagline
- Cores da marca
- Texto legivel em miniatura

#### Ferramentas Recomendadas

| Ferramenta | Uso | Link |
|------------|-----|------|
| Figma | Criar logo e OG image | figma.com |
| Canva | Criar OG image facilmente | canva.com |
| Squoosh | Otimizar imagens | squoosh.app |
| SVGOMG | Otimizar SVG | jakearchibald.github.io/svgomg |
| RealFaviconGenerator | Gerar favicons | realfavicongenerator.net |

### 8. Checklist Final Pre-Inicio

- [ ] Repo GitHub criado e clonado
- [ ] Projeto Supabase criado com credenciais anotadas
- [ ] Projeto Vercel criado e conectado ao repo
- [ ] Variaveis de ambiente configuradas no Vercel
- [ ] Integrações externas configuradas (se necessario)
- [ ] `INPUT.md` preenchido (incluindo funcionalidades padrao)
- [ ] `BRAND.md` preenchido
- [ ] `assets/logo.png` fornecido (512x512, transparente)
- [ ] `assets/logo-bg.png` fornecido (512x512, com fundo)
- [ ] `assets/og-image.png` fornecido (1200x630)
- [ ] Bot Telegram configurado e testado

#### Checklist Adicional - Funcionalidades Padrao

Se habilitado no INPUT.md:

| Funcionalidade | Prerequisitos |
|----------------|---------------|
| AI Support Chat | `OPENAI_API_KEY` configurada no Supabase |
| Notificacoes Email | `RESEND_API_KEY` e `EMAIL_FROM` configuradas |
| Push Notifications | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` configuradas |
| Limites de Uso | Sistema de billing/planos configurado |

---

## COMO INICIAR O PROJETO

Apos completar todos os pre-requisitos acima, siga estes passos:

### Passo 1: Abrir Terminal na Pasta do Projeto

```bash
cd /caminho/para/seu/projeto
```

### Passo 2: Gerar o PRD

```bash
claude "Gere PRD a partir de INPUT.md"
```

O agente vai:
1. Ler seu INPUT.md
2. Fazer perguntas se algo estiver ambiguo
3. Gerar o PRD.md com marcadores [DECISAO] nos pontos que precisam de sua aprovacao

### Passo 3: Revisar e Aprovar o PRD

1. Abra o `PRD.md` gerado
2. Procure por marcadores `[DECISAO]`
3. Para cada decisao, responda ao agente sua escolha
4. O agente vai atualizar o PRD removendo os marcadores

**O PRD esta aprovado quando nao houver mais marcadores [DECISAO]**

### Passo 4: Iniciar Geracao Automatica

```bash
claude "Inicie projeto a partir do PRD.md"
```

**A partir deste ponto, voce NAO precisa fazer mais nada.**

O agente vai:
1. Validar que tudo esta pronto (PRD, BRAND, assets)
2. Criar branch develop
3. Gerar todo o codigo (frontend, backend, integracoes)
4. Rodar testes
5. Fazer deploy em develop
6. Fazer deploy em producao
7. Notificar no Telegram a cada fase

### Passo 5: Aguardar Notificacoes

Voce recebera mensagens no Telegram:
- ✅ FASE 1 CONCLUIDA: Frontend
- ✅ FASE 2 CONCLUIDA: Backend
- ✅ FASE 3 CONCLUIDA: Integracao
- ✅ FASE 4 CONCLUIDA: Site Publico
- 🚀 PROJETO FINALIZADO! (com link de producao)

### Comandos Uteis Durante a Execucao

```bash
# Ver status do projeto
claude "Status do projeto"

# Continuar de onde parou (se interrompido)
claude "Continue projeto a partir da Fase N"

# Ver logs de erro (se algo falhar)
cat .orchestra/logs/*.md
```

---

## DURANTE: Intervencao Zero

Apos aprovar o PRD, **NENHUMA** intervencao humana e necessaria.

### Sobre a Pasta .architecture/

A pasta `.architecture/` contem toda a documentacao do framework (agents, docs, examples).

**Na Fase 0, o Meta-Orchestrator automaticamente:**
1. Adiciona `.architecture/` ao `.gitignore`
2. A pasta permanece local para referencia do Claude
3. O codigo gerado NAO inclui os docs de arquitetura

Isso garante que seu projeto final fique limpo, sem os arquivos de documentacao do framework.

### O que os Agentes Fazem

Os agentes irao:
1. Gerar design system
2. Criar estrutura do projeto
3. Desenvolver frontend
4. Desenvolver backend
5. Integrar frontend + backend
6. Criar landing page + termos + privacidade
7. Rodar testes
8. Fazer deploy em develop
9. Fazer deploy em producao
10. Enviar notificacoes no Telegram

**Se algo falhar**, os agentes:
- Detectam a falha
- Analisam o erro
- Corrigem automaticamente
- Tentam novamente
- Apenas se impossivel resolver, notificam no Telegram com detalhes do erro

---

## DEPOIS: Pos-Deploy em Producao

Apos receber notificacao de conclusao no Telegram:

### 1. Configurar Usuarios Admin (OBRIGATORIO)

Os usuarios que terao acesso ao Admin Panel sao definidos **manualmente** pelo humano.

| # | Acao | Como Fazer |
|---|------|------------|
| 1.1 | Acessar Supabase Dashboard | supabase.com/dashboard > Seu Projeto |
| 1.2 | Criar primeiro usuario admin | Authentication > Users > Adicionar usuario ou usar cadastro normal |
| 1.3 | Atribuir role admin | SQL Editor > Usar comandos do arquivo gerado |
| 1.4 | Testar acesso ao /admin | Logar com usuario e acessar /admin |

**IMPORTANTE**: Os comandos SQL sao **gerados automaticamente** pelo projeto.

Abra o arquivo `generated/admin-setup.sql` e siga as instrucoes. O arquivo contem:
- Comando para encontrar usuario por email
- Comando para atribuir role admin
- Comandos alternativos para outras configuracoes de roles

O SQL gerado reflete a estrutura real do schema criado pelo Database Agent.

### 2. Verificar SEO e Assets (Apenas Projetos Publicos)

Para projetos com landing page, verificar se tudo foi gerado corretamente:

| # | Item | O que Verificar | Onde Ver |
|---|------|-----------------|----------|
| 2.1 | Title | Titulo da pagina conforme PRD | `<title>` no HTML |
| 2.2 | Meta Description | Descricao conforme PRD | `<meta name="description">` |
| 2.3 | Favicon | Icone no browser | Tab do navegador |
| 2.4 | Logo | Logo no header/footer | Pagina inicial |
| 2.5 | OG Image | Imagem de compartilhamento | Compartilhar no WhatsApp/Twitter |
| 2.6 | robots.txt | Permite indexacao | `/robots.txt` |
| 2.7 | sitemap.xml | Mapa do site | `/sitemap.xml` |

**Nota**: Projetos privados/internos devem ter:
- `robots.txt` com `Disallow: /`
- Sem sitemap publico
- Sem Google Analytics

### 3. Configurar Emails do Supabase (OBRIGATORIO)

Os templates de email do Supabase sao **gerados automaticamente** com base no design system do projeto.

#### 3.1 Templates Gerados

Os templates estao na pasta `generated/email-templates/`:

```
generated/email-templates/
├── confirm-signup.html       # Confirmacao de cadastro
├── invite-user.html          # Convite de usuario
├── magic-link.html           # Magic link
├── change-email.html         # Alteracao de email
├── reset-password.html       # Recuperacao de senha
└── README.md                 # Instrucoes de como aplicar
```

Cada template ja inclui:
- Logo do projeto (URL do Supabase Storage)
- Cores do design system (primary, background, text)
- Tipografia configurada
- Textos no idioma do projeto
- Rodape com nome da empresa

#### 3.2 Como Aplicar os Templates

1. Supabase Dashboard > Authentication > Email Templates
2. Para cada template:
   - Clique em "Edit"
   - Copie o conteudo do arquivo correspondente em `generated/email-templates/`
   - Cole no editor
   - Salve

**Nota**: Infelizmente o Supabase nao tem API para atualizar templates de email, entao este passo e manual.

#### 3.3 Variaveis do Supabase

Os templates gerados ja usam as variaveis corretas. Para referencia:

| Variavel | Descricao | Templates |
|----------|-----------|-----------|
| `{{ .ConfirmationURL }}` | Link de confirmacao | Todos |
| `{{ .Token }}` | Token de confirmacao | Todos |
| `{{ .TokenHash }}` | Hash do token | Todos |
| `{{ .SiteURL }}` | URL do site | Todos |
| `{{ .Email }}` | Email do usuario | Todos |
| `{{ .NewEmail }}` | Novo email (alteracao) | Change Email |

#### 3.4 Configurar URLs

Em Supabase Dashboard > Authentication > URL Configuration:

| Campo | Valor |
|-------|-------|
| Site URL | `https://seu-projeto.vercel.app` |
| Redirect URLs | `https://seu-projeto.vercel.app/**` |

**Adicionar URLs de redirect:**
- `https://seu-projeto.vercel.app/auth/callback`
- `https://seu-projeto.vercel.app/auth/reset-password`
- `https://seu-projeto.vercel.app/invite/accept`

### 4. Validacao Manual

| # | Acao | O que Verificar |
|---|------|-----------------|
| 4.1 | Testar fluxo de login | Login, logout, sessao persistida |
| 4.2 | Testar recuperacao de senha | Email chega, link funciona, senha reseta |
| 4.3 | Testar convite (se aplicavel) | Email de convite, aceitar, criar conta |
| 4.4 | Testar pagamentos | Se houver, fazer compra teste |
| 4.5 | Testar emails | Verificar estilo e se emails chegam |
| 4.6 | Testar mobile | Responsividade em dispositivos reais |
| 4.7 | Testar instalacao PWA | Instalar app em Android/iOS/Desktop |
| 4.8 | Verificar performance | Lighthouse score > 90 (Performance, PWA, SEO) |
| 4.9 | Verificar termos/privacidade | Conteudo legal adequado |
| 4.10 | Testar Admin Panel | Acessar /admin com usuario admin |

### 5. Configuracoes Finais (Se Necessario)

| # | Acao | Quando |
|---|------|--------|
| 5.1 | Dominio customizado | Se quiser dominio proprio |
| 5.2 | SSL customizado | Se dominio proprio - não é necessário com Vercel |
| 5.3 | CDN adicional | Se precisar de performance extra |
| 5.4 | Backup automatico | Configurar backups do Supabase |

### 6. Dominio Customizado (Opcional)

```bash
# No Vercel
vercel domains add meudominio.com

# Configurar DNS no provedor:
# A record: 76.76.21.21
# CNAME www: cname.vercel-dns.com
```

### 7. Monitoramento (Recomendado)

| Servico | Proposito | Como Configurar |
|---------|-----------|-----------------|
| Vercel Analytics | Metricas de uso | Ativar no dashboard |
| Supabase Logs | Logs de banco/functions | Ja ativo por padrao |
| Sentry | Tracking de erros | Adicionar SDK + DSN |
| UptimeRobot | Monitorar uptime | Criar monitor para URL |

### 8. Checklist Final Pos-Deploy

- [ ] **Usuarios admin configurados** (OBRIGATORIO)
- [ ] **Templates de email estilizados** (OBRIGATORIO)
- [ ] **URLs de redirect configuradas** (OBRIGATORIO)
- [ ] Admin Panel testado e funcionando
- [ ] Fluxo de login/logout testado
- [ ] Recuperacao de senha testada
- [ ] Convite de usuarios testado (se aplicavel)
- [ ] Pagamentos testados (se aplicavel)
- [ ] Emails chegando com estilo correto
- [ ] Mobile responsivo
- [ ] PWA instalavel (testado em Android, iOS, Desktop)
- [ ] Indicador offline aparece quando sem conexao
- [ ] SEO verificado (apenas projetos publicos)
- [ ] Performance adequada (Lighthouse > 90)
- [ ] Lighthouse PWA score 100
- [ ] Termos e privacidade revisados
- [ ] Dominio customizado configurado (se desejado)
- [ ] Monitoramento ativo
- [ ] Backup configurado

#### Checklist Adicional - Funcionalidades Padrao

Se habilitado:

**AI Support Chat:**
- [ ] OPENAI_API_KEY configurada no Supabase
- [ ] Nome e tom do assistente configurados no Admin Panel
- [ ] Chat flutuante funcionando
- [ ] NPS sendo coletado ao encerrar

**Sistema de Notificacoes:**
- [ ] Sininho no header mostrando contador
- [ ] Preferencias de notificacao funcionando
- [ ] Emails de notificacao chegando (se habilitado)
- [ ] Push notifications funcionando (se habilitado)

**Barras Promocionais:**
- [ ] Editor de barras funcional no Admin Panel
- [ ] Preview em tempo real
- [ ] Barra aparece para usuarios
- [ ] Botao de fechar funciona

**Criacao de Notificacoes (Admin):**
- [ ] Wizard de criacao funcional
- [ ] Preview por canal
- [ ] Notificacoes sendo enviadas
- [ ] Historico sendo registrado

**Limites de Uso:**
- [ ] Limites configurados por plano no banco
- [ ] Barra de alerta aparece em 80%
- [ ] Barra de bloqueio aparece em 100%
- [ ] Botao de upgrade funciona

---

## Troubleshooting

### Se o Bot Telegram Nao Funcionar

1. Verificar se o token esta correto
2. Verificar se o bot foi adicionado ao canal/grupo
3. Verificar se o chat_id esta correto
4. Testar manualmente: `curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" -d "chat_id=<CHAT_ID>&text=Teste"`

### Se o Deploy Falhar

1. Verificar logs no Vercel
2. Verificar se todas as envs estao configuradas
3. Verificar se o build local funciona (`npm run build`)
4. Verificar se ha erros de TypeScript

### Se as Migrations Falharem

1. Verificar logs no Supabase
2. Verificar se as migrations estao na ordem correta
3. Verificar se nao ha conflitos de schema
4. Tentar rodar manualmente: `supabase db push`

---

## Resumo Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                        HUMANO FAZ                               │
├─────────────────────────────────────────────────────────────────┤
│  ANTES (uma vez)          │  ANTES (por projeto)                │
│  • Criar contas           │  • Criar repo GitHub                │
│  • Gerar tokens           │  • Criar projeto Supabase           │
│  • Configurar CLI         │  • Criar projeto Vercel             │
│                           │  • Configurar envs                  │
│                           │  • Preencher INPUT.md               │
│                           │  • Preencher BRAND.md               │
│                           │  • Fornecer assets visuais:         │
│                           │    - logo.png (512x512)             │
│                           │    - logo-bg.png (512x512 c/ fundo) │
│                           │    - og-image.png (1200x630)        │
│                           │  • Aprovar PRD                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AGENTES FAZEM TUDO                          │
│  • Design System → Frontend → Backend → Integracao              │
│  • Landing Page → Termos → Privacidade                          │
│  • Testes → Deploy Develop → Deploy Producao                    │
│  • Notificacoes no Telegram em cada fase                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        HUMANO FAZ                               │
├─────────────────────────────────────────────────────────────────┤
│  DEPOIS (usando arquivos gerados em generated/)                 │
│  • Configurar usuarios admin (usar generated/admin-setup.sql)   │
│  • Aplicar templates de email (copiar de generated/email-templates/) │
│  • Configurar URLs de redirect do Supabase                      │
│  • Verificar SEO (title, description, og:image)                 │
│  • Testar Admin Panel                                           │
│  • Testar fluxos de auth (login, recuperacao, convite)          │
│  • Configurar dominio customizado (opcional)                    │
│  • Ativar monitoramento                                         │
│  • Revisar termos/privacidade                                   │
└─────────────────────────────────────────────────────────────────┘
```
