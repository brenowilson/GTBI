# Template de PRD para Geracao por IA

## Principios Fundamentais

LLMs de fronteira conseguem seguir consistentemente **150-200 instrucoes**. A solucao e estruturar o trabalho em **6 fases com 30-50 requisitos cada**, ao inves de uma especificacao massiva.

### Fases do Framework

| Fase | Nome | Conteudo | Notificacao | Condicao |
|------|------|----------|-------------|----------|
| 0 | Setup | Design System, estrutura base | - | Sempre |
| 1 | Frontend | UI completa, componentes, hooks | Telegram | Sempre |
| 2 | Backend | Migrations, Edge Functions, RLS | Telegram | Sempre |
| 3 | Integracao | Front↔Back, integracoes externas | Telegram | Sempre |
| 4 | Site Publico + Admin | Landing (se publico), termos, privacidade, Admin Panel | Telegram | Sempre (conteudo varia) |
| Final | Producao | Deploy em main | Telegram | Sempre |

### Regras Criticas

1. **Ordenacao por dependencia**: database -> API -> business logic -> UI -> integracao
2. **Non-goals explicitos**: IA nao infere por omissao - diga o que NAO fazer
3. **Criterios quantificados**: "botao responde em <200ms", nao "deve ser rapido"
4. **Fases independentes**: cada fase deve ter um deliverable testavel

---

## Template PRD

```markdown
# PRD: [Nome do Produto]

## 1. Sumario Executivo

- **Visao**: [Descricao em 1-2 frases do que o produto faz e por que existe]
- **Usuarios-Alvo**: [Personas primarias e secundarias]
- **Metricas de Sucesso**: [Indicadores quantificaveis - ex: "80% dos usuarios completam onboarding em <5min"]

## 2. Idioma e Tipo de Projeto (OBRIGATORIO)

### Idioma da Interface
- [ ] Portugues (pt-BR)
- [ ] Ingles (en-US)
- [ ] Espanhol (es)
- [ ] Outro: ___

**Nota**: Independente do idioma da interface, todo codigo (variaveis, funcoes, tabelas, commits) deve ser em ingles.

### Acesso ao Sistema
- [ ] **Publico** - Qualquer pessoa pode se cadastrar
- [ ] **Privado/Interno** - Apenas usuarios convidados

### Cadastro de Usuarios
- [ ] **Self-service** - Usuarios se cadastram via landing page/cadastro
- [ ] **Apenas convite** - Usuarios sao adicionados por admins/membros

### Landing Page
- [ ] **Sim** - Pagina de marketing publica com SEO
- [ ] **Nao** - Ponto de entrada e a tela de login (sem landing page)

### Multiplos Usuarios/Organizacoes
- [ ] **Sim** - Times/organizacoes com multiplos membros (requer sistema de roles e convites)
- [ ] **Nao** - Apenas usuarios individuais

---

**Implicacoes das escolhas:**

| Configuracao | Consequencia |
|--------------|--------------|
| Publico + Self-service + Landing | Fase 4 completa (landing, SEO, Google Analytics) |
| Privado + Convite + Sem Landing | Pular Fase 4, entrada pelo /login, robots.txt com noindex |
| Multiplos usuarios | Sistema de convites, roles hierarquicas, gestao de membros |

**Nota**: Se "Privado/Interno" estiver marcado:
- NAO gerar landing page
- NAO configurar Google Analytics
- Configurar robots.txt com `Disallow: /`
- Ponto de entrada: `/login`

---

## 3. Requisitos Funcionais (Por Fase)

### Fase 1: Foundation
**Dependencias**: Nenhuma
**Outcome Testavel**: [Deliverable especifico - ex: "Usuario consegue fazer login via magic link"]

| ID | Requisito | Prioridade | Criterios de Aceite |
|----|-----------|------------|---------------------|
| FR-101 | Autenticacao com magic link | HIGH | - Email enviado em <3s / - Link expira em 15min / - Redirect para dashboard apos auth |
| FR-102 | Tabela de usuarios criada | HIGH | - RLS habilitado / - Policy de isolamento ativa |

### Fase 2: Core Features
**Dependencias**: Fase 1 completa
**Outcome Testavel**: [Deliverable especifico]

| ID | Requisito | Prioridade | Criterios de Aceite |
|----|-----------|------------|---------------------|
| FR-201 | ... | ... | ... |

### Fase 3: [Nome]
**Dependencias**: Fases 1, 2 completas | Pode rodar paralelo com: Fase 4
**Outcome Testavel**: [Deliverable especifico]

...

## 4. Non-Goals Explicitos (CRITICO)

Esta secao e OBRIGATORIA. A IA nao assume o que voce nao quer.

### Nao implementar nesta versao
- [ ] Feature X - sera adicionada na v2
- [ ] Integracao com sistema Y - fora do escopo inicial
- [ ] Suporte a plataforma Z

### Nao usar
- [ ] Tecnologia A - usar B ao inves (motivo: ...)
- [ ] Pattern C - usar D ao inves (motivo: ...)
- [ ] Biblioteca E - usar F ao inves (motivo: ...)

### Limites de escopo
- [ ] Maximo de N usuarios simultaneos nesta fase
- [ ] Apenas idioma X suportado
- [ ] Apenas regiao Y

## 5. Especificacoes Tecnicas

### Stack Obrigatoria
- **Frontend**: React 19 + Vite + TypeScript strict + shadcn/ui
- **Backend**: Supabase (Edge Functions + PostgreSQL + RLS)
- **Deploy**: Vercel (frontend) + Supabase Cloud (backend)
- **Testes**: Vitest + Testing Library

### Estrutura de Pastas
Ver CLAUDE.md para estrutura completa.

### Integracoes Externas
| Servico | Proposito | Credenciais |
|---------|-----------|-------------|
| Stripe | Pagamentos | STRIPE_SECRET_KEY |
| Resend | Emails | RESEND_API_KEY |

## 6. Rastreamento de Fases

| # | Fase | Status | Depende | Agentes | Condicao |
|---|------|--------|---------|---------|----------|
| 0 | Setup | pending | - | Design System Generator | Sempre |
| 1 | Frontend | pending | 0 | Frontend Agent, Test Generator, Code Reviewer | Sempre |
| 2 | Backend | pending | 0 | Database Agent, Code Executor, Test Generator | Sempre |
| 3 | Integracao | pending | 1, 2 | Integration Agent, Test Generator (E2E) | Sempre |
| 4 | Site Publico + Admin | pending | 1 | Landing Page Agent (se publico), Legal Generator (se publico), Admin Panel Agent | Sempre (conteudo varia) |
| Final | Producao | pending | 3, 4 | Deploy Agent, Notification Agent | Sempre |

**Nota**: Se o projeto for privado/interno:
- Landing page e documentos legais NAO sao gerados
- Admin Panel e SEMPRE gerado (independente do tipo de projeto)
- robots.txt configurado com `Disallow: /`

## 7. Requisitos Nao-Funcionais

### Performance
- [ ] Tempo de carregamento inicial: <3s
- [ ] Time to Interactive: <5s
- [ ] API response time: <500ms (p95)

### Seguranca
- [ ] RLS em todas as tabelas
- [ ] HTTPS obrigatorio
- [ ] Tokens em HttpOnly cookies
- [ ] Rate limiting em APIs publicas

### Acessibilidade
- [ ] WCAG 2.1 AA compliance
- [ ] Navegacao por teclado
- [ ] Screen reader compativel

## 8. Glossario

| Termo | Definicao |
|-------|-----------|
| Tenant | Organizacao/empresa no sistema multi-tenant |
| Member | Usuario pertencente a um tenant |
```

---

## Exemplo de Uso

### PRD Minimo Viavel

```markdown
# PRD: TaskFlow - Gerenciador de Tarefas

## 1. Sumario Executivo
- **Visao**: App de tarefas simples para times pequenos
- **Usuarios-Alvo**: Times de 2-10 pessoas
- **Metricas**: 70% retention D7

## 2. Requisitos Funcionais

### Fase 1: Auth + Database
**Outcome**: Usuario logado ve dashboard vazio

| ID | Requisito | Prioridade | Criterios |
|----|-----------|------------|-----------|
| FR-101 | Magic link auth | HIGH | Email <3s, expira 15min |
| FR-102 | Tabela tasks | HIGH | RLS por user_id |

### Fase 2: CRUD Tasks
**Outcome**: Usuario cria, edita, deleta tasks

| ID | Requisito | Prioridade | Criterios |
|----|-----------|------------|-----------|
| FR-201 | Criar task | HIGH | Titulo obrigatorio, descricao opcional |
| FR-202 | Listar tasks | HIGH | Ordenado por created_at desc |
| FR-203 | Editar task | MEDIUM | Inline editing |
| FR-204 | Deletar task | MEDIUM | Confirmacao antes |

## 3. Non-Goals
- NAO: Subtasks, tags, filtros avancados
- NAO: App mobile (apenas web responsivo)
- NAO: Colaboracao real-time (polling simples)

## 4. Stack
React + Vite + Supabase (ver CLAUDE.md)

## 5. Fases
| # | Fase | Status | Depende |
|---|------|--------|---------|
| 1 | Auth | pending | - |
| 2 | CRUD | pending | 1 |
```

---

## Checklist de Revisao

Antes de enviar o PRD para geracao:

- [ ] Cada fase tem <50 requisitos
- [ ] Todas as fases tem outcome testavel
- [ ] Non-goals estao explicitos
- [ ] Criterios de aceite sao quantificados
- [ ] Dependencias entre fases estao claras
- [ ] Stack tecnica esta definida
- [ ] Nao ha ambiguidades (ex: "deve ser rapido" -> "<200ms")
