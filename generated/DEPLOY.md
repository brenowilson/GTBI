# GTBI — Checklist Pos-Deploy

Guia completo de todos os passos manuais necessarios apos o deploy do GTBI.

---

## Pre-requisitos

Antes de iniciar, confirme que voce tem:

- [x] Repositorio GitHub criado e com o codigo do GTBI
- [x] Projeto Supabase criado (regiao: **sa-east-1** — Sao Paulo)
- [x] Projeto Vercel criado e conectado ao repositorio GitHub
- [x] Conta no portal de desenvolvedores iFood (https://developer.ifood.com.br)
- [x] Conta Resend (https://resend.com)
- [x] Chave de API OpenAI com acesso a `gpt-4` e `gpt-image-1`
- [x] Servidor Uazapi configurado para WhatsApp

---

## 1. Variaveis de Ambiente

### 1.1 GitHub Secrets (CI/CD)

Acesse: **GitHub > Repositorio > Settings > Secrets and variables > Actions**

| Secret | Descricao | Onde obter |
|--------|-----------|------------|
| `SUPABASE_ACCESS_TOKEN` | Token pessoal do Supabase CLI | Supabase Dashboard > Account > Access Tokens |
| `SUPABASE_PROJECT_REF_PROD` | Ref do projeto de producao | Supabase Dashboard > Settings > General > Reference ID |
| `SUPABASE_DB_PASSWORD_PROD` | Senha do banco de producao | Definida na criacao do projeto Supabase |
| `SUPABASE_PROJECT_REF_DEV` | Ref do projeto de desenvolvimento | Idem (projeto dev separado, se houver) |
| `SUPABASE_DB_PASSWORD_DEV` | Senha do banco de desenvolvimento | Idem |

> **Nota**: O workflow `deploy-supabase.yml` usa `SUPABASE_PROJECT_REF_PROD` + `SUPABASE_DB_PASSWORD_PROD` quando o push e na branch `main`, e as variaveis `_DEV` quando e na branch `development`.

### 1.2 Vercel — Variaveis de Ambiente

Acesse: **Vercel > Projeto > Settings > Environment Variables**

| Variavel | Valor | Ambientes |
|----------|-------|-----------|
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Anon key do projeto Supabase | Production, Preview, Development |
| `VITE_APP_URL` | URL de producao da Vercel (ex: `https://gtbi.vercel.app`) | Production |

> **Onde obter as chaves Supabase**: Dashboard > Settings > API > Project URL e `anon` `public` key.

### 1.3 Supabase Edge Function Secrets

Execute via CLI (ou pelo Dashboard em Settings > Edge Functions > Secrets):

```bash
# Conectar ao projeto
supabase link --project-ref <PROJECT_REF>

# Definir secrets (um comando por vez ou todos juntos)
supabase secrets set \
  IFOOD_CLIENT_ID=seu-client-id \
  IFOOD_CLIENT_SECRET=seu-client-secret \
  OPENAI_API_KEY=sk-sua-chave \
  RESEND_API_KEY=re_sua-chave \
  RESEND_FROM_EMAIL=noreply@seudominio.com \
  UAZAPI_SERVER_URL=https://seu-servidor-uazapi.com \
  UAZAPI_ADMIN_TOKEN=seu-token-admin \
  SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

| Secret | Servico | Descricao |
|--------|---------|-----------|
| `IFOOD_CLIENT_ID` | iFood | Client ID do app registrado no portal iFood |
| `IFOOD_CLIENT_SECRET` | iFood | Client Secret do app iFood |
| `OPENAI_API_KEY` | OpenAI | API key com acesso a gpt-4 e gpt-image-1 |
| `RESEND_API_KEY` | Resend | API key para envio de emails |
| `RESEND_FROM_EMAIL` | Resend | Email remetente (dominio verificado no Resend) |
| `UAZAPI_SERVER_URL` | Uazapi | URL do servidor Uazapi |
| `UAZAPI_ADMIN_TOKEN` | Uazapi | Token admin do Uazapi |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Service role key (Dashboard > Settings > API) |

> **IMPORTANTE**: A `SUPABASE_SERVICE_ROLE_KEY` e necessaria para que as Edge Functions acessem o banco com permissoes elevadas (bypass de RLS). Nunca exponha essa chave no frontend.

---

## 2. Primeiro Deploy

### 2.1 Deploy do Backend (Supabase)

O deploy do backend e automatico via GitHub Actions:

1. Faca push para a branch `development` (ou `main` para producao)
2. O workflow `.github/workflows/deploy-supabase.yml` executa automaticamente:
   - Aplica todas as migrations (10 arquivos SQL)
   - Faz deploy de todas as 15 Edge Functions
3. Acompanhe o progresso em **GitHub > Actions**

**Se preferir deploy manual**:

```bash
supabase link --project-ref <PROJECT_REF>
supabase db push
supabase functions deploy
```

### 2.2 Deploy do Frontend (Vercel)

O deploy do frontend e automatico:

1. A Vercel detecta pushes no GitHub e faz deploy automaticamente
2. Framework: Vite (configurado em `vercel.json`)
3. SPA routing: todas as rotas redirecionam para `/index.html`

> **Verifique**: Apos o primeiro deploy, acesse a URL da Vercel e confirme que a tela de login aparece (sem erros no console).

---

## 3. Pos-Deploy (Passos Manuais Obrigatorios)

### 3.1 Criar usuario admin no Supabase Auth

1. Acesse: **Supabase Dashboard > Authentication > Users**
2. Clique em **Add User > Create New User**
3. Preencha:
   - **Email**: `admin@gtbi.com.br` (ou o email desejado)
   - **Password**: senha forte (min 8 chars, 1 maiuscula, 1 numero)
   - Marque **Auto Confirm User**
4. Clique em **Create User**

> **IMPORTANTE**: O trigger `handle_new_user` cria automaticamente o perfil na tabela `user_profiles`. Aguarde alguns segundos antes do proximo passo.

### 3.2 Executar script admin-setup.sql

1. Acesse: **Supabase Dashboard > SQL Editor**
2. Clique em **New Query**
3. Cole o conteudo do arquivo `generated/admin-setup.sql`
4. Se o email do admin for diferente de `admin@gtbi.com.br`, altere na linha:
   ```sql
   SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@gtbi.com.br';
   ```
5. Clique em **Run**

Este script faz 3 coisas:
- Atribui a role `admin` ao usuario criado
- Cria os storage buckets `reports` e `evidences`
- Configura as politicas de acesso (RLS) dos buckets

### 3.3 Verificar storage buckets

Apos executar o script, confirme em:

1. **Supabase Dashboard > Storage**
2. Devem existir 2 buckets:
   - `reports` (privado) — armazena PDFs de relatorios
   - `evidences` (privado) — armazena evidencias de acoes

---

## 4. Configuracao de Servicos Externos

### 4.1 iFood — Portal de Desenvolvedores

1. Acesse https://developer.ifood.com.br
2. Registre um novo aplicativo
3. Obtenha o `Client ID` e `Client Secret`
4. Configure as permissoes/modulos necessarios:
   - Merchant (dados de lojas)
   - Catalog (cardapio)
   - Order (pedidos)
   - Events (eventos operacionais)
   - Logistics (logistica)
   - Shipping (envio)
   - Review (avaliacoes)
   - Financial (financeiro)
5. Defina os secrets na Supabase (secao 1.3)

> **Nota**: O fluxo OAuth2 do iFood e feito pela Edge Function `ifood-connect`. Os tokens sao armazenados com seguranca via Supabase Vault.

### 4.2 Resend — Email Transacional

1. Acesse https://resend.com e crie uma conta
2. Verifique seu dominio (DNS):
   - Adicione os registros TXT, DKIM e SPF conforme instrucoes do Resend
3. Crie uma API key em **Settings > API Keys**
4. Defina os secrets:
   - `RESEND_API_KEY`: a chave criada
   - `RESEND_FROM_EMAIL`: email do dominio verificado (ex: `noreply@gtconsultoria.com.br`)

> **Usado para**: convites de usuario, envio de relatorios por email, notificacoes admin.

### 4.3 OpenAI — API de IA

1. Acesse https://platform.openai.com
2. Crie uma API key em **API Keys**
3. Verifique que sua conta tem acesso a:
   - **gpt-4** (ou gpt-4-turbo) — usado para auto-respostas a avaliacoes e chamados
   - **gpt-image-1** — usado para geracao/melhoria de imagens de produtos
4. Defina o secret `OPENAI_API_KEY`

> **Atencao ao billing**: A geracao de imagens consome creditos significativos. Monitore o uso em https://platform.openai.com/usage

### 4.4 Uazapi — WhatsApp

1. Configure o servidor Uazapi
2. Obtenha a URL do servidor e o token admin
3. Defina os secrets:
   - `UAZAPI_SERVER_URL`: URL completa do servidor (ex: `https://uazapi.seuservidor.com`)
   - `UAZAPI_ADMIN_TOKEN`: token de autenticacao admin

> **Usado para**: envio de relatorios PDF por WhatsApp, notificacoes admin via WhatsApp.

---

## 5. Configuracao do Supabase Auth

### 5.1 Desabilitar auto-signup

Como o sistema e privado (apenas convite):

1. **Supabase Dashboard > Authentication > Providers**
2. Em **Email**, desabilite **Enable Sign Up** (ou configure para exigir confirmacao)
3. Isso garante que novos usuarios so entram via convite do admin

### 5.2 Configurar URL de redirect

1. **Supabase Dashboard > Authentication > URL Configuration**
2. **Site URL**: URL de producao da Vercel (ex: `https://gtbi.vercel.app`)
3. **Redirect URLs**: adicione a URL de producao (necessario para reset de senha e convites)

### 5.3 Configurar email templates (opcional)

1. **Supabase Dashboard > Authentication > Email Templates**
2. Personalize os templates de:
   - Confirmacao de email
   - Reset de senha
   - Convite (magic link)

---

## 6. Configuracao de CRON Jobs (Supabase)

Os seguintes jobs precisam ser configurados para automacao:

### 6.1 Coleta diaria de dados iFood

Acesse: **Supabase Dashboard > Database > Extensions** e habilite `pg_cron`.

Depois, no **SQL Editor**:

```sql
-- Coleta diaria de dados iFood (executa todo dia as 03:00 BRT = 06:00 UTC)
SELECT cron.schedule(
  'ifood-daily-collect',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/ifood-collect-data',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Geracao de relatorios semanais (toda segunda as 06:00 BRT = 09:00 UTC)
SELECT cron.schedule(
  'weekly-report-generate',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/report-generate',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Refresh de tokens iFood (a cada 30 minutos)
SELECT cron.schedule(
  'ifood-token-refresh',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/ifood-refresh-token',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

> **IMPORTANTE**: Substitua `<PROJECT_REF>` pelo Reference ID do seu projeto Supabase. Para que `net.http_post` funcione, habilite tambem a extensao `pg_net`.

---

## 7. Verificacao Pos-Deploy

Execute cada item para confirmar que o deploy esta funcional:

### 7.1 Frontend

- [ ] Acessar a URL da Vercel no navegador
- [ ] Tela de login carrega sem erros
- [ ] Console do navegador sem erros de CORS ou chaves ausentes

### 7.2 Autenticacao

- [ ] Login com o usuario admin criado
- [ ] Dashboard admin carrega corretamente
- [ ] Logout funciona

### 7.3 Edge Functions

Teste via curl ou pelo proprio app:

```bash
# Verificar se as Edge Functions estao respondendo
curl -i https://<PROJECT_REF>.supabase.co/functions/v1/admin-stats \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Lista das 16 Edge Functions que devem estar deployed:
- `auth-invite`
- `auth-accept-invite`
- `ifood-connect`
- `ifood-refresh-token`
- `ifood-sync-restaurants`
- `ifood-collect-data`
- `report-generate`
- `report-send`
- `review-auto-respond`
- `ticket-auto-respond`
- `image-generate`
- `image-apply-catalog`
- `financial-export`
- `admin-stats`
- `admin-send-notification`
- `whatsapp-instance`

Verifique no **Supabase Dashboard > Edge Functions** que todas estao listadas e com status ativo.

### 7.4 Banco de Dados

- [ ] 10 migrations aplicadas com sucesso (verificar em Supabase > Database > Migrations)
- [ ] Tabela `roles` contem a role `admin` com `is_system = true`
- [ ] Tabela `user_roles` contem o vinculo do usuario admin
- [ ] Storage buckets `reports` e `evidences` existem

### 7.5 Integracoes

- [ ] Secrets das Edge Functions configurados (verificar em Supabase > Settings > Edge Functions)
- [ ] Testar convite de usuario (envia email via Resend?)
- [ ] Testar conexao iFood (OAuth2 funciona?)

---

## 8. Troubleshooting

### Erro: "User admin@gtbi.com.br not found"

O usuario ainda nao foi criado no Supabase Auth. Volte ao passo 3.1.

### Erro: "Admin role not found"

As migrations nao foram aplicadas. Verifique se o workflow de deploy executou com sucesso, ou execute `supabase db push` manualmente.

### Edge Functions retornam 500

Verifique se os secrets foram configurados (secao 1.3). Acesse os logs em **Supabase Dashboard > Edge Functions > [funcao] > Logs**.

### CORS errors no frontend

Verifique se `VITE_SUPABASE_URL` esta correta na Vercel. A URL deve ser `https://<ref>.supabase.co` (sem barra final).

### Emails nao chegam (Resend)

1. Verifique se o dominio esta verificado no Resend
2. Confirme que `RESEND_FROM_EMAIL` usa o dominio verificado
3. Cheque os logs do Resend em https://resend.com/emails

### WhatsApp nao envia (Uazapi)

1. Verifique se o servidor Uazapi esta online
2. Confirme que `UAZAPI_SERVER_URL` esta acessivel
3. Verifique se o `UAZAPI_ADMIN_TOKEN` esta correto
4. Cheque se a sessao do WhatsApp esta conectada no Uazapi

---

## Resumo Rapido

```
1. Configurar GitHub Secrets (5 secrets)
2. Configurar Vercel Env Vars (3 variaveis)
3. Push para branch development/main (deploy automatico)
4. Configurar Supabase Edge Function Secrets (8 secrets)
5. Criar usuario admin no Supabase Auth Dashboard
6. Executar admin-setup.sql no SQL Editor
7. Configurar servicos externos (iFood, Resend, OpenAI, Uazapi)
8. Desabilitar auto-signup no Supabase Auth
9. Configurar Site URL e Redirect URLs
10. Habilitar pg_cron + pg_net e criar CRON jobs
11. Verificar: login, dashboard, Edge Functions, buckets
```
