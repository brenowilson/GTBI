# Documentacao Viva

## IMPORTANTE: Documentacao do PROJETO, nao do Framework

Este documento define a documentacao do **PROJETO DERIVADO**, nao do framework.

| Tipo | Local | Descricao |
|------|-------|-----------|
| **Documentacao do PROJETO** | `docs/`, `changelog/`, `sessions/`, `DATABASE.md` | Gerada e mantida pelos agentes no projeto derivado |
| **Documentacao do FRAMEWORK** | `.architecture/` | Instrucoes para os agentes (gitignored no projeto) |

**Regra clara:**
- `docs/` na raiz = documentacao do PROJETO (commitada, publica)
- `.architecture/docs/` = documentacao do FRAMEWORK (gitignored, privada)

---

## Visao Geral

Toda documentacao do **projeto derivado** e **viva** - mantida automaticamente conforme o projeto evolui. Quando features sao adicionadas, modificadas ou removidas, a documentacao e atualizada automaticamente.

---

## Principio Fundamental

> **Documentacao desatualizada e pior que nenhuma documentacao.**

Por isso, o framework trata documentacao como codigo:
- Gerada automaticamente na criacao
- Atualizada automaticamente em modificacoes
- Removida automaticamente em delecoes
- Versionada junto com o codigo

---

## Estrutura de Documentacao do Projeto Derivado

**NOTA**: Esta estrutura e criada no **projeto derivado**, nao no repositorio do framework.

```
/projeto-derivado/                     # <<< PROJETO DERIVADO, nao o framework
├── docs/                              # Documentacao tecnica do PROJETO
│   ├── api/                           # API Documentation (Swagger)
│   │   ├── openapi.yaml               # Especificacao OpenAPI
│   │   └── README.md                  # Como usar a API
│   │
│   ├── features/                      # Documentacao por feature
│   │   ├── INDEX.md                   # Indice de features
│   │   ├── auth.md                    # Feature: Autenticacao
│   │   ├── tasks.md                   # Feature: Tarefas
│   │   └── [feature].md               # Uma doc por feature
│   │
│   └── help-center/                   # Central de Ajuda (user-facing)
│       ├── _meta.json                 # Metadados do Help Center
│       ├── primeiros-passos/          # Categoria
│       │   ├── _category.json
│       │   └── *.md                   # Artigos
│       └── [categoria]/
│
├── changelog/                         # Historico de mudancas
│   ├── CHANGELOG.md                   # Changelog consolidado
│   └── releases/                      # Changelogs por versao
│       ├── v1.0.0.md
│       ├── v1.1.0.md
│       └── ...
│
├── sessions/                          # Historico de desenvolvimento
│   ├── INDEX.md
│   └── session-*.md
│
└── DATABASE.md                        # Schema do banco (ja existente)
```

---

## 1. API Documentation (Swagger/OpenAPI)

### O que e documentado

Toda Edge Function e documentada automaticamente:

```yaml
# docs/api/openapi.yaml
openapi: 3.0.3
info:
  title: [Nome do Projeto] API
  version: 1.0.0
  description: API do projeto gerada automaticamente

servers:
  - url: https://xxx.supabase.co/functions/v1
    description: Production

paths:
  /create-task:
    post:
      summary: Criar nova tarefa
      tags: [Tasks]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTaskInput'
      responses:
        '200':
          description: Tarefa criada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '400':
          $ref: '#/components/responses/BadRequest'
```

### Quando atualizar

| Evento | Acao |
|--------|------|
| Nova Edge Function criada | Adicionar endpoint ao openapi.yaml |
| Edge Function modificada | Atualizar schema/responses |
| Edge Function removida | Remover endpoint |
| Novo tipo/schema | Adicionar em components/schemas |

### Quem atualiza

- **Code Executor**: Ao criar/modificar Edge Functions
- **Integration Agent**: Ao conectar endpoints

### Estrutura do docs/api/README.md

```markdown
# API Documentation

## Base URL

- **Production**: `https://xxx.supabase.co/functions/v1`
- **Local**: `http://localhost:54321/functions/v1`

## Autenticacao

Todas as rotas (exceto publicas) requerem header:

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

## Endpoints

### Tasks

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | /create-task | Criar tarefa |
| GET | /list-tasks | Listar tarefas |
| PATCH | /update-task | Atualizar tarefa |
| DELETE | /delete-task | Deletar tarefa |

### Auth

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | /magic-link | Enviar magic link |
| POST | /invite-user | Convidar usuario |

## Erros

Todos os erros seguem o formato:

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descricao do erro",
    "details": {}
  }
}
\`\`\`

## Swagger UI

Para visualizar a documentacao interativa:
1. Abra https://editor.swagger.io
2. Importe o arquivo `openapi.yaml`
```

---

## 2. Feature Documentation

### O que e documentado

Cada feature tem sua documentacao tecnica:

```markdown
# Feature: Tasks

## Visao Geral

Sistema de gerenciamento de tarefas com atribuicao, prazos e status.

## Arquitetura

### Camadas

| Camada | Arquivos |
|--------|----------|
| Presentation | `src/features/tasks/components/` |
| Hooks | `src/features/tasks/hooks/` |
| Use Cases | `src/features/tasks/useCases/` |
| Entity | `src/entities/task/` |
| Repository | `src/shared/repositories/supabase/taskRepository.ts` |

### Diagrama

\`\`\`
TaskList (component)
    ↓
useTasks (hook)
    ↓
listTasksUseCase (use case)
    ↓
taskRepository (repository)
    ↓
Supabase (database)
\`\`\`

## Database

### Tabela: tasks

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | PK |
| title | TEXT | Titulo da tarefa |
| status | task_status | pending, in_progress, done |
| assignee_id | UUID | FK → users |
| due_date | TIMESTAMPTZ | Prazo |
| created_at | TIMESTAMPTZ | Criacao |

### RLS Policies

- `tasks_select`: Usuario ve tarefas do workspace
- `tasks_insert`: Usuario cria tarefas no workspace
- `tasks_update`: Usuario atualiza tarefas atribuidas
- `tasks_delete`: Apenas owner pode deletar

## API Endpoints

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| /create-task | POST | Criar tarefa |
| /list-tasks | GET | Listar tarefas |
| /update-task | PATCH | Atualizar |
| /delete-task | DELETE | Deletar |

## Componentes React

| Componente | Descricao |
|------------|-----------|
| TaskList | Lista de tarefas com filtros |
| TaskCard | Card individual de tarefa |
| TaskForm | Formulario de criacao/edicao |
| TaskFilters | Filtros de status e assignee |

## Hooks

| Hook | Descricao |
|------|-----------|
| useTasks | Lista tarefas com React Query |
| useCreateTask | Mutation para criar |
| useUpdateTask | Mutation para atualizar |
| useDeleteTask | Mutation para deletar |

## Regras de Negocio

1. Tarefa so pode ser deletada pelo criador
2. Status segue fluxo: pending → in_progress → done
3. Tarefa atrasada e destacada visualmente
4. Notificacao enviada quando tarefa e atribuida

## Testes

| Tipo | Arquivo | Cobertura |
|------|---------|-----------|
| Unit | `useCases/__tests__/createTask.test.ts` | 95% |
| Integration | `hooks/__tests__/useTasks.test.tsx` | 90% |
| E2E | `e2e/tasks.spec.ts` | 85% |
```

### Quando atualizar

| Evento | Acao |
|--------|------|
| Nova feature criada | Criar docs/features/[feature].md |
| Feature modificada | Atualizar doc correspondente |
| Feature removida | Remover doc + atualizar INDEX.md |
| Novo componente | Adicionar na secao Componentes |
| Nova regra de negocio | Adicionar na secao Regras |

### Quem atualiza

- **Code Executor**: Ao criar/modificar features
- **Database Agent**: Secao de Database
- **Test Generator**: Secao de Testes

---

## 3. Help Center (User-Facing)

### O que e documentado

Artigos de ajuda para usuarios finais:

```
docs/help-center/
├── _meta.json                    # Config geral
├── primeiros-passos/
│   ├── _category.json
│   ├── criando-sua-conta.md
│   ├── navegando-pelo-dashboard.md
│   └── configurando-perfil.md
├── tarefas/
│   ├── _category.json
│   ├── criando-tarefas.md
│   ├── atribuindo-tarefas.md
│   └── gerenciando-prazos.md
└── configuracoes/
    ├── _category.json
    └── ...
```

### Quando atualizar

| Evento | Acao |
|--------|------|
| Nova feature user-facing | Criar artigos explicando |
| Feature modificada | Atualizar artigos existentes |
| Feature removida | Arquivar/remover artigos |
| UI alterada | Atualizar screenshots |
| Novo fluxo de usuario | Criar tutorial |

### Quem atualiza

- **Help Center Generator**: Geracao inicial
- **Code Executor**: Quando modifica features, solicita atualizacao ao Help Center Generator

### Regra de manutencao

Quando uma feature user-facing e modificada, o agente DEVE:

1. Identificar artigos do Help Center relacionados
2. Atualizar conteudo para refletir mudanca
3. Atualizar screenshots se UI mudou
4. Verificar links internos
5. Atualizar _meta.json se categorias mudaram

---

## 4. Changelog

### Estrutura

```
changelog/
├── CHANGELOG.md              # Consolidado (todas as versoes)
└── releases/
    ├── v1.0.0.md             # Release inicial
    ├── v1.1.0.md             # Minor release
    └── v1.1.1.md             # Patch release
```

### Formato do CHANGELOG.md

```markdown
# Changelog

Todas as mudancas notaveis do projeto sao documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [Unreleased]

### Added
- Feature de relatorios (#45)

### Changed
- Melhoria na performance do dashboard (#42)

### Fixed
- Correcao do bug de login (#41)

---

## [1.1.0] - 2026-02-10

### Added
- Sistema de notificacoes push (#30)
- Filtros avancados no dashboard (#28)

### Changed
- Redesign do card de tarefas (#25)

### Fixed
- Correcao do timezone em datas (#22)

### Security
- Atualizacao de dependencias com vulnerabilidades (#20)

---

## [1.0.0] - 2026-02-05

### Added
- Geracao inicial do projeto
- Sistema de autenticacao com magic link
- CRUD de tarefas
- Dashboard com visao geral
- Sistema de convites
```

### Quando atualizar

| Evento | Secao |
|--------|-------|
| Nova feature | Added |
| Feature modificada | Changed |
| Bug corrigido | Fixed |
| Feature removida | Removed |
| Deprecacao | Deprecated |
| Vulnerabilidade | Security |

### Quem atualiza

- **Code Executor**: Ao concluir qualquer mudanca
- **Deploy Agent**: Ao fazer release, move [Unreleased] para nova versao

### Automacao

Ao concluir uma tarefa, o agente adiciona entrada no changelog:

```typescript
async function atualizarChangelog(tipo: 'Added' | 'Changed' | 'Fixed' | 'Removed', descricao: string) {
  const changelog = await lerArquivo('changelog/CHANGELOG.md');

  // Encontrar secao [Unreleased]
  const unreleasedIndex = changelog.indexOf('## [Unreleased]');
  const secaoIndex = changelog.indexOf(`### ${tipo}`, unreleasedIndex);

  // Adicionar entrada
  const novaEntrada = `- ${descricao}\n`;

  // Salvar
  await salvarArquivo('changelog/CHANGELOG.md', changelogAtualizado);
}
```

---

## 5. DATABASE.md (Ja Existente)

Mantido pelo **Database Agent** conforme documentado em `docs/06-migrations.md`.

---

## Fluxo de Atualizacao

### Ao adicionar feature

```
1. Code Executor cria codigo
2. Code Executor cria docs/features/[feature].md
3. Code Executor atualiza docs/features/INDEX.md
4. Code Executor atualiza changelog (Added)
5. Help Center Generator cria artigos user-facing
6. Database Agent atualiza DATABASE.md (se houver tabelas)
7. Code Executor atualiza docs/api/openapi.yaml (se houver endpoints)
```

### Ao modificar feature

```
1. Code Executor modifica codigo
2. Code Executor atualiza docs/features/[feature].md
3. Code Executor atualiza changelog (Changed)
4. Help Center Generator atualiza artigos relacionados
5. Database Agent atualiza DATABASE.md (se schema mudou)
6. Code Executor atualiza docs/api/openapi.yaml (se endpoints mudaram)
```

### Ao remover feature

```
1. Code Executor remove codigo
2. Code Executor remove docs/features/[feature].md
3. Code Executor atualiza docs/features/INDEX.md
4. Code Executor atualiza changelog (Removed)
5. Help Center Generator arquiva/remove artigos relacionados
6. Database Agent atualiza DATABASE.md (migration de remocao)
7. Code Executor remove endpoints do docs/api/openapi.yaml
```

---

## Validacao de Documentacao

### Pre-commit check

Antes de commitar, verificar:

```bash
# Verificar se docs existem para features novas
for feature in src/features/*/; do
  feature_name=$(basename $feature)
  if [ ! -f "docs/features/${feature_name}.md" ]; then
    echo "ERRO: Falta docs/features/${feature_name}.md"
    exit 1
  fi
done

# Verificar se changelog foi atualizado
if git diff --cached --name-only | grep -q "src/"; then
  if ! git diff --cached --name-only | grep -q "changelog/"; then
    echo "AVISO: Codigo modificado mas changelog nao atualizado"
  fi
fi
```

### Code Reviewer check

O Code Reviewer verifica:

- [ ] Nova feature tem docs/features/[feature].md
- [ ] Changelog atualizado
- [ ] DATABASE.md atualizado (se aplicavel)
- [ ] API docs atualizados (se aplicavel)
- [ ] Help Center atualizado (se feature user-facing)

---

## Integracao com Agentes

### Code Executor

Responsavel por:
- Criar/atualizar docs/features/*.md
- Criar/atualizar docs/api/openapi.yaml
- Atualizar changelog/CHANGELOG.md

### Database Agent

Responsavel por:
- Manter DATABASE.md

### Help Center Generator

Responsavel por:
- Criar/atualizar docs/help-center/**

### Deploy Agent

Responsavel por:
- Criar changelog/releases/vX.X.X.md ao fazer release
- Mover [Unreleased] para nova versao no CHANGELOG.md

---

## Resumo

| Documentacao | Localizacao | Responsavel | Quando Atualiza |
|--------------|-------------|-------------|-----------------|
| API (Swagger) | docs/api/ | Code Executor | Edge Functions mudam |
| Features | docs/features/ | Code Executor | Features mudam |
| Help Center | docs/help-center/ | Help Center Generator | Features user-facing mudam |
| Changelog | changelog/ | Code Executor + Deploy Agent | Qualquer mudanca |
| Database | DATABASE.md | Database Agent | Schema muda |
| Sessions | sessions/ | Todos os agentes | Apos cada tarefa |
