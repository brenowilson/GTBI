# Governanca do Projeto

## Visao Geral

Este documento define as regras de governanca para projetos derivados do framework, incluindo controle de versao, revisao de codigo e gestao de configuracoes.

---

## Branches

### Estrutura

```
main (production)
  ↑
develop (staging)
  ↑
feat/*, fix/* (feature branches)
```

### Nomenclatura

| Prefixo | Uso | Exemplo |
|---------|-----|---------|
| `feat/` | Nova funcionalidade | `feat/auth-magic-link` |
| `fix/` | Correcao de bug | `fix/login-redirect` |
| `refactor/` | Refatoracao sem mudanca de comportamento | `refactor/api-client` |
| `docs/` | Documentacao | `docs/readme-update` |
| `test/` | Adicao/correcao de testes | `test/auth-coverage` |
| `chore/` | Tarefas de manutencao | `chore/deps-update` |

### Regras

- `main`: Sempre deployavel, protegida
- `develop`: Integracao continua, staging
- Feature branches: Vida curta (<1 semana idealmente)

---

## Commits

### Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Tipos

| Tipo | Descricao |
|------|-----------|
| `feat` | Nova funcionalidade |
| `fix` | Correcao de bug |
| `docs` | Documentacao |
| `style` | Formatacao (sem mudanca de codigo) |
| `refactor` | Refatoracao |
| `test` | Testes |
| `chore` | Manutencao |
| `perf` | Performance |
| `ci` | CI/CD |

### Exemplos

```bash
# Feature
feat(auth): add magic link authentication

# Fix
fix(api): handle null response in user fetch

# Com body
feat(dashboard): add task filtering

Adds ability to filter tasks by status and date.
Includes unit tests for filter logic.

# Com scope
feat(ui): add EmptyState component
```

---

## Pull Requests

### Template

```markdown
## Descricao
[O que essa PR faz e por que]

## Tipo de Mudanca
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentacao

## Checklist
- [ ] Codigo segue o style guide
- [ ] Self-review realizado
- [ ] Testes adicionados/atualizados
- [ ] Documentacao atualizada
- [ ] Sem secrets expostos

## Screenshots (se aplicavel)
[Antes/Depois]

## Como Testar
1. Passo 1
2. Passo 2
```

### Regras

- PRs pequenas e focadas (< 400 linhas idealmente)
- Titulo segue Conventional Commits
- Pelo menos 1 aprovacao antes de merge
- CI deve passar
- Conflitos resolvidos antes de merge

---

## Code Review

### O que verificar

| Categoria | Itens |
|-----------|-------|
| **Funcionalidade** | Codigo faz o que deveria? Edge cases cobertos? |
| **Design** | Segue arquitetura? Abstracoes adequadas? |
| **Legibilidade** | Codigo claro? Nomes significativos? |
| **Seguranca** | Sem vulnerabilidades? RLS presente? |
| **Performance** | Sem N+1? Queries otimizadas? |
| **Testes** | Cobertura adequada? Casos de borda? |

### Feedback

```markdown
# Bom
"Considere extrair essa logica para um hook reutilizavel"

# Ruim
"Isso ta errado"
```

### Aprovacao

- **Approve**: Pronto para merge
- **Request Changes**: Mudancas necessarias antes de aprovar
- **Comment**: Feedback sem bloqueio

---

## Controle de Secrets

### NUNCA commitar

```gitignore
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
service-account.json
```

### Onde armazenar

| Secret | Local |
|--------|-------|
| Dev local | `.env.local` (gitignored) |
| CI/CD | GitHub Secrets |
| Preview | Vercel Environment Variables (Preview) |
| Production | Vercel + Supabase Vault |

### Rotacao

- API keys: a cada 90 dias
- Tokens de servico: a cada 30 dias
- Apos vazamento: imediatamente

---

## ADRs (Architecture Decision Records)

### Quando criar

- Escolha de tecnologia
- Mudanca de arquitetura
- Trade-offs significativos
- Decisoes que afetam multiplas areas

### Template

```markdown
# ADR-001: [Titulo]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## Contexto
[Qual problema estamos resolvendo?]

## Decisao
[O que decidimos fazer?]

## Consequencias
[Quais sao os impactos positivos e negativos?]

## Alternativas Consideradas
[O que mais foi avaliado e por que descartamos?]
```

### Localizacao

```
docs/
└── adr/
    ├── 001-escolha-supabase.md
    ├── 002-feature-sliced-design.md
    └── template.md
```

---

## Versionamento Semantico

### Formato

```
MAJOR.MINOR.PATCH

1.0.0 -> 1.0.1 (patch: bug fix)
1.0.1 -> 1.1.0 (minor: nova feature compativel)
1.1.0 -> 2.0.0 (major: breaking change)
```

### Changelog

```markdown
# Changelog

## [1.1.0] - 2026-01-30
### Added
- Magic link authentication
- Dashboard filtering

### Fixed
- Login redirect loop

### Changed
- Updated dependencies
```

---

## Responsabilidades

### Quem aprova o que

| Area | Responsavel | Backup |
|------|-------------|--------|
| Frontend | Frontend Lead | CTO |
| Backend | Backend Lead | CTO |
| Database | DBA / Backend | CTO |
| Security | Security Lead | CTO |
| Infra/CI | DevOps | CTO |

### Evitando gargalos

- PRs pequenas = reviews rapidos
- Rotacao de reviewers
- Timeout de 24h para review (escalar se necessario)
- CTO como fallback para PRs urgentes

---

## Releases

### Processo

1. Feature branches mergeadas em `develop`
2. QA em staging
3. PR de `develop` para `main`
4. Review final
5. Merge + deploy automatico
6. Tag de versao
7. Release notes

### Hotfix

```
main
  ↓
hotfix/critical-bug
  ↓
main (merge + tag)
  ↓
develop (cherry-pick)
```

---

## Checklists

### Antes de criar PR

- [ ] Branch atualizada com develop
- [ ] Testes passando localmente
- [ ] Lint sem erros
- [ ] Self-review realizado
- [ ] Commits organizados (squash se necessario)

### Antes de aprovar PR

- [ ] Codigo revisado
- [ ] Testes adequados
- [ ] Documentacao atualizada
- [ ] Sem secrets expostos
- [ ] CI passando

### Antes de deploy

- [ ] PR aprovada
- [ ] Conflitos resolvidos
- [ ] Staging testado (se aplicavel)
- [ ] Comunicacao com time (se breaking change)
