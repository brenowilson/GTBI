# Claude Code Configuration

Este arquivo configura o comportamento do Claude Code para projetos derivados deste framework.

---

## MANUTENCAO DO FRAMEWORK (OBRIGATORIO - LER PRIMEIRO)

**ATENCAO**: Esta secao aplica-se quando voce esta trabalhando NO PROPRIO FRAMEWORK (este repositorio), NAO em projetos derivados.

### Regras Inviolaveis

Ao fazer QUALQUER alteracao neste framework, voce DEVE:

#### 1. CRIAR SESSAO (OBRIGATORIO)

```
sessions/session-YYYYMMDD-HHMM-titulo-curto.md
```

A sessao DEVE ser criada **DURANTE** o trabalho, nao depois. Conteudo minimo:

```markdown
[SESSION]
Timestamp: YYYY-MM-DDTHH:MM-03:00
Solicitante: [Nome]

## Tarefa
[O que foi solicitado]

## Arquivos Criados
[Lista]

## Arquivos Modificados
[Lista]

## Verificacao de Consistencia
[Tabela com status]

## Conclusao
[Resumo]
```

#### 2. VERIFICAR CONSISTENCIA (OBRIGATORIO)

Antes de commitar, verificar que a mudanca e CONSISTENTE com **TODOS os docs relevantes**.

**IMPORTANTE**: A lista abaixo sao EXEMPLOS, nao uma lista exaustiva. Voce DEVE verificar QUALQUER doc que possa ser afetado pela mudanca.

**Exemplos de verificacoes (NAO LIMITADOS A ESTES):**

| Categoria | Exemplos de Docs | Perguntas |
|-----------|------------------|-----------|
| Arquitetura | `01-arquitetura.md` | Camadas respeitadas? Patterns seguidos? |
| Seguranca | `04-seguranca.md` | RLS necessario? OWASP considerado? |
| Testes | `05-testes.md` | Padrao de testes seguido? Cobertura? |
| Migrations | `06-migrations.md` | DATABASE.md atualizado? |
| Governanca | `03-governanca.md` | Commits, PRs, branches corretos? |
| Responsividade | `14-responsividade-mobile.md` | Mobile-first? Touch targets? |
| PWA | `15-pwa.md` | Service worker afetado? |
| Design System | `02-design-system.md` | Tokens, componentes consistentes? |
| Agentes | `00-fluxo-agentes.md` | Agente novo/modificado registrado? |
| INPUT | `10-input-projeto.md` | Nova funcionalidade adicionada? |
| Checklist Humano | `12-checklist-humano.md` | Pre-requisito humano novo? |
| Funcionalidades | `16-20-*.md` | Padroes de features seguidos? |

**Regra de ouro**: Se a mudanca TOCA em algo, verificar TODOS os docs que FALAM sobre esse algo.

#### 3. VERIFICAR SINERGIA (OBRIGATORIO)

Toda mudanca deve estar em SINERGIA com o resto do framework:

- [ ] Novos docs seguem numeracao sequencial (00, 01, 02...)
- [ ] Novos agents seguem formato padrao de `docs/00-fluxo-agentes.md`
- [ ] Referencias cruzadas atualizadas (docs que referenciam outros docs)
- [ ] Nenhuma referencia quebrada (arquivos deletados mas ainda referenciados)

#### 4. GOVERNANCA

| Acao | Regra |
|------|-------|
| Criar doc | Numerar sequencialmente, atualizar 00-fluxo-agentes.md |
| Criar agent | Seguir formato padrao, registrar em 00-fluxo-agentes.md |
| Modificar padrao | Verificar TODOS os docs que usam esse padrao |
| Deletar arquivo | Buscar referencias e atualizar |

#### 5. COMMIT E PUSH

Apos verificar consistencia e sinergia:

```bash
git add [arquivos]
git commit -m "tipo: descricao"
git push
```

### Checklist Rapido (Copiar e Usar)

```markdown
## Checklist de Manutencao do Framework

- [ ] Sessao criada em sessions/
- [ ] Consistencia com Clean Architecture verificada
- [ ] Consistencia com docs de seguranca verificada
- [ ] Sinergia com outros docs verificada
- [ ] Referencias cruzadas atualizadas
- [ ] 00-fluxo-agentes.md atualizado (se necessario)
- [ ] INPUT.md atualizado (se nova funcionalidade)
- [ ] Commit realizado
- [ ] Push realizado
- [ ] Sessao finalizada com conclusao
```

### Penalidades por Nao Seguir

Se estas regras nao forem seguidas:
- O framework perde consistencia
- Projetos derivados podem ter problemas
- Divida tecnica acumula
- Usuario perde confianca no framework

**NUNCA PULE ESTAS REGRAS.**

---

## Stack Tecnica

- **Frontend**: React 19 + Vite + TypeScript (strict mode)
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions, Storage)
- **State**: React Query (server state) + Zustand (client state)
- **Validacao**: Zod (runtime validation + type inference)
- **Testes**: Vitest + Testing Library
- **Deploy**: Vercel (frontend) + Supabase Cloud (backend)

## Arquitetura: Clean Architecture + Feature-Sliced Design

### Camadas

```
PRESENTATION (UI, routing, hooks)
      ↓
APPLICATION (Use Cases)
      ↓
DOMAIN (Entities, Rules, Errors)
      ↓
INFRASTRUCTURE (Repositories, Services)
```

### Estrutura de Pastas

```
src/
├── app/                          # Composition root
│   ├── providers/
│   ├── router/
│   └── App.tsx
│
├── components/                   # UI compartilhada
│   ├── ui/                       # shadcn/ui (NAO modificar)
│   ├── common/                   # Customizados
│   └── layout/
│
├── features/                     # Modulos por feature
│   └── [feature]/
│       ├── components/           # UI da feature
│       ├── hooks/                # React hooks
│       ├── useCases/             # Logica de aplicacao
│       ├── types.ts              # DTOs
│       └── index.ts              # Public API
│
├── entities/                     # Domain models
│   └── [entity]/
│       ├── model.ts              # Zod schema
│       ├── rules.ts              # Regras de negocio
│       └── index.ts
│
├── domain/                       # Shared domain
│   ├── errors/                   # Erros tipados
│   └── types/                    # Result pattern
│
├── shared/                       # Infrastructure
│   ├── repositories/
│   │   ├── interfaces/           # Contratos
│   │   └── supabase/             # Implementacoes
│   ├── services/
│   ├── lib/
│   └── config/
│
└── stores/                       # Estado global

supabase/
├── functions/
│   ├── _shared/
│   ├── _domain/
│   └── [function]/
│       ├── handlers/
│       ├── useCases/
│       └── repositories/
├── migrations/
└── seed.sql
```

## Convencoes de Codigo

### Idioma do Codigo (OBRIGATORIO)

Independente do idioma da interface do projeto, **TODO codigo deve ser em ingles**:

| Elemento | Idioma | Exemplo |
|----------|--------|---------|
| Variaveis | Ingles | `const userName`, `let isLoading` |
| Funcoes | Ingles | `createTask()`, `validateEmail()` |
| Classes/Tipos | Ingles | `Task`, `UserProfile` |
| Tabelas do banco | Ingles | `users`, `tasks`, `organizations` |
| Colunas do banco | Ingles | `created_at`, `user_id`, `is_active` |
| Commits | Ingles | `feat: add user authentication` |
| Nomes de arquivos | Ingles | `TaskList.tsx`, `use-auth.ts` |
| Comentarios tecnicos | Ingles | `// Validate input before processing` |

**Excecoes** (seguem idioma do projeto):
- Textos exibidos na UI (labels, mensagens, placeholders)
- Mensagens de erro user-facing
- Documentacao de ajuda (Help Center)
- Conteudo de emails transacionais

### Clean Code (OBRIGATORIO)

O codigo gerado deve seguir principios de Clean Code:

1. **Nomes significativos**: Nomes devem revelar intencao
   - `getUserById()` em vez de `getU()`
   - `isEmailValid` em vez de `flag`

2. **Funcoes pequenas**: Uma funcao, uma responsabilidade
   - Max 20-30 linhas por funcao
   - Se precisar de comentario para explicar, extrair em funcao

3. **Evitar comentarios obvios**: Codigo deve ser auto-explicativo
   - Comentarios apenas para "por que", nao "o que"

4. **DRY (Don't Repeat Yourself)**: Nao duplicar logica
   - Extrair em funcoes/hooks reutilizaveis

5. **Tratamento de erros**: Erros explicitos, nao silenciosos
   - Usar Result pattern, nao try-catch generico

6. **Formatacao consistente**: Prettier + ESLint
   - Indentacao: 2 espacos
   - Max 100 caracteres por linha

### Nomenclatura
- **Variaveis/funcoes**: camelCase
- **Componentes/tipos/classes**: PascalCase
- **Arquivos componente**: PascalCase.tsx
- **Arquivos utilitarios**: kebab-case.ts
- **Colunas do banco**: snake_case
- **Edge Functions**: kebab-case

### Patterns Obrigatorios
- Features isoladas em `/src/features/[nome]/`
- Use Cases em `/src/features/[nome]/useCases/`
- Repositories com interface em `/shared/repositories/interfaces/`
- Entities com Zod schema + rules
- Result pattern para erros
- React Query para dados de API
- Zustand apenas para estado local/UI

### Anti-Patterns (EVITAR)
- Logica de negocio em componentes ou hooks
- Importar repository diretamente em componentes
- useState para dados de API
- Modificar componentes em `/ui/`
- Erros genericos (usar domain errors)
- Acessar Supabase diretamente (usar repository)

## Camadas e Responsabilidades

### Presentation (components/, hooks/)
- Renderizacao de UI
- Captura de eventos do usuario
- Chamada de use cases via hooks
- Tratamento de erros para exibicao

### Application (useCases/)
- Orquestracao de logica
- Validacao de input
- Aplicacao de regras de negocio
- Coordenacao de repositories

### Domain (entities/, domain/)
- Schemas Zod
- Regras de negocio puras
- Erros tipados
- Result pattern

### Infrastructure (repositories/, services/)
- Acesso a dados (Supabase)
- Servicos externos (email, storage)
- Mapeamento DB ↔ Domain

## Regras de Dependencia

| Camada | Pode importar de | NAO pode importar de |
|--------|------------------|----------------------|
| components/ | hooks, entities | useCases, repositories |
| hooks/ | useCases, entities, domain | repositories |
| useCases/ | entities, domain, interfaces | implementacoes |
| entities/ | domain | features, shared |
| domain/ | Nada | Tudo |
| repositories/ | entities, lib | features |

## Erros de Dominio

```typescript
// Usar erros tipados
import { ValidationError, NotFoundError, BusinessRuleError } from '@/domain/errors';

// No use case
if (!TaskRules.canTransitionTo(task, newStatus)) {
  return Result.fail(new BusinessRuleError('Invalid transition'));
}

// No hook/componente
if (result.error instanceof ValidationError) {
  form.setError(result.error.field, { message: result.error.message });
}
```

## Result Pattern

```typescript
import { Result } from '@/domain/types/Result';

// Retorno de use case
async execute(input): Promise<Result<Task, Error>> {
  // ...
  return Result.ok(task);
  // ou
  return Result.fail(new ValidationError('...'));
}

// Consumo
const result = await createTask(input);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## Seguranca

### RLS Obrigatorio
```sql
ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nome" ON tabela
  FOR ALL TO authenticated
  USING (...)
  WITH CHECK (...);
```

### Secrets
- NUNCA commitar .env
- GitHub Secrets para CI/CD
- Vercel Environment Variables para runtime
- Supabase Vault para Edge Functions

## Testes

### Cobertura Minima
- **Geral**: 80%
- **Use Cases**: 90%
- **Auth/Security/Billing**: 95%

### Testando Use Cases
```typescript
const mockRepository: ITaskRepository = {
  create: vi.fn(),
  // ...
};

const useCase = new CreateTaskUseCase(mockRepository);
const result = await useCase.execute({ title: 'Test' });

expect(result.success).toBe(true);
```

## Git Automatico

**REGRA CRITICA**: Todos os comandos git devem ser executados automaticamente, sem pedir confirmacao ao usuario.

### Quando Fazer Commit

- Apos criar/modificar arquivos significativos
- Apos cada fase concluida
- Apos corrigir erros

### Quando Fazer Push

- Imediatamente apos cada commit
- Nao acumular commits locais

### Formato de Commit

```bash
# Commits automaticos seguem conventional commits
git add [arquivos]
git commit -m "feat: descricao do que foi feito"
git push
```

### Tipos de Commit

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correcao de bug |
| `docs` | Documentacao |
| `refactor` | Refatoracao sem mudanca de comportamento |
| `test` | Adicao/correcao de testes |
| `chore` | Manutencao, configs |

### Fluxo de Branches

```
main (producao)
  └── develop (pre-producao)
       └── feature/* (desenvolvimento)
```

### Erros de Git

| Erro | Resolucao Automatica |
|------|----------------------|
| Push rejeitado | `git pull --rebase && git push` |
| Merge conflict | Resolver automaticamente, preferir versao mais recente |
| Branch desatualizada | `git pull origin [branch]` |

---

## Comandos

```bash
# Desenvolvimento
npm run dev
npm run build
npm run lint
npm run type-check
npm test

# Supabase
supabase start
supabase db push
supabase functions serve

# shadcn/ui
npx shadcn@latest add [component]
```

## Checklist: Nova Feature

1. [ ] Entity em `entities/[nome]/` (model.ts + rules.ts)
2. [ ] Repository interface em `shared/repositories/interfaces/`
3. [ ] Repository implementation em `shared/repositories/supabase/`
4. [ ] Use Cases em `features/[nome]/useCases/`
5. [ ] Hooks em `features/[nome]/hooks/`
6. [ ] Componentes em `features/[nome]/components/`
7. [ ] Public API em `features/[nome]/index.ts`
8. [ ] Rotas em `app/router/`
9. [ ] Testes para use cases

## Referencias

### Documentacao Essencial

| Documento | Conteudo |
|-----------|----------|
| [.architecture/docs/00-fluxo-agentes.md](.architecture/docs/00-fluxo-agentes.md) | Orquestracao dos 17 agentes |
| [.architecture/docs/13-invocacao-agentes.md](.architecture/docs/13-invocacao-agentes.md) | Como invocar cada agente |
| [.architecture/docs/01-arquitetura.md](.architecture/docs/01-arquitetura.md) | Clean + Feature-Sliced Design |
| [.architecture/docs/14-responsividade-mobile.md](.architecture/docs/14-responsividade-mobile.md) | Mobile-first, breakpoints, touch |
| [.architecture/docs/15-pwa.md](.architecture/docs/15-pwa.md) | PWA instalavel, service worker |
| [.architecture/docs/04-seguranca.md](.architecture/docs/04-seguranca.md) | OWASP, RLS, secrets |
| [.architecture/docs/05-testes.md](.architecture/docs/05-testes.md) | Vitest, cobertura |
| [.architecture/docs/06-migrations.md](.architecture/docs/06-migrations.md) | Migrations + DATABASE.md |
| [.architecture/docs/12-checklist-humano.md](.architecture/docs/12-checklist-humano.md) | Pre-requisitos humanos |

### Exemplos

| Arquivo | Conteudo |
|---------|----------|
| [.architecture/examples/INPUT-taskflow.md](.architecture/examples/INPUT-taskflow.md) | Exemplo de briefing preenchido |
| [.architecture/examples/BRAND.md](.architecture/examples/BRAND.md) | Template de brand manual |

### Agentes

O projeto usa **17 agentes** para geracao automatica. Ver [.architecture/docs/00-fluxo-agentes.md](.architecture/docs/00-fluxo-agentes.md) para lista completa e fluxo de orquestracao.

Principais:
- **PRD Generator**: Briefing → PRD
- **Meta-Orchestrator**: Coordena fluxo completo
- **Frontend Agent**: UI completa
- **Database Agent**: Migrations + RLS + DATABASE.md
- **Deploy Agent**: Vercel + Supabase
