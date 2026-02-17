# Sessoes e Historico

## Visao Geral

Cada acao significativa gera um registro de sessao para rastreabilidade completa de decisoes, acoes e evolucao do sistema.

---

## IMPORTANTE: Duas Localizacoes de Sessions

O framework distingue entre dois tipos de sessions:

| Tipo | Localizacao | Conteudo |
|------|-------------|----------|
| **Sessions do Framework** | `.architecture/sessions/` | Historico de desenvolvimento do proprio framework |
| **Sessions do Projeto** | `sessions/` (raiz) | Historico de desenvolvimento do projeto derivado |

### Por que separar?

- Sessions do **framework** documentam como o framework foi construido
- Sessions do **projeto** documentam como o projeto derivado evolui
- Evita misturar historicos diferentes
- `.architecture/` vai para o `.gitignore` do projeto, mas `sessions/` nao

### Na pratica

```
/projeto-derivado/
├── sessions/                              # Sessions do PROJETO (commitadas)
│   ├── session-20260205-1000-geracao-inicial.md
│   ├── session-20260205-1030-frontend-completo.md
│   └── session-20260210-1500-nova-feature.md
│
├── .architecture/                         # Framework (gitignored)
│   └── sessions/                          # Sessions do FRAMEWORK (nao commitadas)
│       ├── session-20260130-0238-inicio-setup.md
│       └── ...
```

---

## Estrutura de Sessions do Projeto

```
sessions/
├── INDEX.md                               # Indice de todas as sessions
├── session-20260205-1000-geracao-inicial.md
├── session-20260205-1030-frontend-fase1.md
├── session-20260205-1100-backend-fase2.md
└── ...
```

---

## Padrao de Salvamento

- **Pasta:** `sessions/` (raiz do projeto)
- **Formato:** Markdown (`.md`)
- **Nomenclatura:** `session-YYYYMMDD-HHMM-titulo.md`
- **Frequencia:** Um arquivo por fase/tarefa/decisao significativa

---

## Template de Sessao

```markdown
[SESSION]
Timestamp: YYYY-MM-DDTHH:MM-03:00
Solicitante: [Nome ou Meta-Orchestrator]
Agente: [Tipo do agente]
Fase: [Numero da fase, se aplicavel]

Resumo:
- [Descricao breve do que foi feito]

Acoes executadas:
- [Arquivo criado/modificado]
- [Decisao tomada]
- [Comando executado]

Arquivos gerados/modificados:
- [Lista de arquivos]

Review:
- Code Reviewer: [score, se aplicavel]

Conclusao:
[Resultado final]

Proximos passos:
[Se aplicavel]
```

---

## O que Registrar

### Sempre registrar (sessions do projeto)
- Conclusao de cada fase (0, 1, 2, 3, 4)
- Geracao de PRD
- Decisoes arquiteturais do projeto
- Adicao de novas features
- Modificacao significativa de features
- Remocao de features
- Correcoes de bugs importantes
- Mudancas de configuracao
- Deploys em producao

### Nao precisa registrar
- Comandos triviais (git status, ls)
- Correcoes de typo
- Exploracao sem conclusao
- Ajustes de estilo menores

---

## Exemplo Real

```markdown
[SESSION]
Timestamp: 2026-02-05T10:30-03:00
Solicitante: Meta-Orchestrator
Agente: Frontend Agent
Fase: 1

Resumo:
- Geracao completa do frontend a partir do PRD.md
- Todas as paginas e componentes criados
- Testes gerados e passando

Arquivos gerados:
- src/app/(app)/dashboard/page.tsx
- src/features/tasks/components/TaskList.tsx
- src/features/tasks/components/TaskCard.tsx
- src/features/tasks/hooks/useTasks.ts
- ... (47 arquivos)

Review:
- Code Reviewer: 0.92 (aprovado)

Conclusao:
Frontend completo deployado em develop.
URL: https://projeto-develop.vercel.app

Proximos passos:
- Fase 2: Backend (Database Agent + Code Executor)
```

---

## Automacao

### Geracao automatica

Agentes geram session automaticamente ao concluir tarefas:

```typescript
// Pseudo-codigo
async function finalizarFase(fase: number, resultado: Resultado) {
  const sessao = gerarSessao({
    timestamp: new Date().toISOString(),
    solicitante: 'Meta-Orchestrator',
    agente: resultado.agente,
    fase: fase,
    resumo: resultado.resumo,
    arquivos: resultado.arquivosModificados,
    review: resultado.reviewScore,
  });

  // IMPORTANTE: salvar em sessions/ (raiz), NAO em .architecture/sessions/
  await salvarArquivo(`sessions/session-${timestamp}-${slug}.md`, sessao);

  // Atualizar indice
  await atualizarIndice('sessions/INDEX.md', sessao);
}
```

### Indice de sessoes

O arquivo `sessions/INDEX.md` e mantido automaticamente:

```markdown
# Indice de Sessoes

## Geracao Inicial

| Data | Titulo | Agente | Fase | Resumo |
|------|--------|--------|------|--------|
| 2026-02-05 10:00 | geracao-inicial | PRD Generator | 0 | PRD aprovado |
| 2026-02-05 10:30 | frontend-fase1 | Frontend Agent | 1 | UI completa |
| 2026-02-05 11:00 | backend-fase2 | Database Agent | 2 | Migrations + RLS |
| 2026-02-05 11:30 | integracao-fase3 | Integration Agent | 3 | Front + Back conectados |
| 2026-02-05 12:00 | site-publico-fase4 | Landing Page Agent | 4 | Landing + Termos + Admin |

## Evolucao do Projeto

| Data | Titulo | Agente | Resumo |
|------|--------|--------|--------|
| 2026-02-10 15:00 | nova-feature-relatorios | Code Executor | Feature de relatorios |
| 2026-02-15 09:00 | fix-auth-bug | Code Executor | Correcao de bug no auth |
```

---

## Integracao com Git

Sessions do projeto sao commitadas junto com o trabalho:

```bash
# Ao finalizar uma fase ou tarefa
git add [arquivos-modificados] sessions/session-*.md sessions/INDEX.md
git commit -m "feat: descricao da mudanca"
git push
```

**IMPORTANTE**: Sessions do projeto (`sessions/`) sao commitadas. Sessions do framework (`.architecture/sessions/`) NAO sao commitadas pois `.architecture/` esta no `.gitignore`.

---

## Boas Praticas

- Sessions sao imutaveis (nao editar depois de criar)
- Timestamps precisos (incluir timezone -03:00)
- Titulos descritivos em kebab-case
- Listar todos os arquivos afetados
- Incluir score do Code Reviewer quando aplicavel
- Incluir URL de deploy quando aplicavel
- Incluir proximos passos quando aplicavel
- Manter INDEX.md sempre atualizado
