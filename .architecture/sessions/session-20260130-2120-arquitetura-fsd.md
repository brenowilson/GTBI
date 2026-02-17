[SESSION]
Timestamp: 2026-01-30T21:20-03:00
Solicitante: Breno
Modelo: Claude Opus 4.5

Resumo da sessao:
- Reescrita completa do documento docs/01-arquitetura.md
- Implementacao do Feature-Sliced Design (FSD) como padrao arquitetural

Conteudo principal:
- Estrutura de pastas detalhada (frontend + backend)
- Hierarquia de camadas: app -> features -> entities -> shared
- Matriz de dependencias com regras de importacao
- Separacao de estado: React Query (server) vs Zustand (client)
- Validacao com Zod para dados externos
- Checklist para adicionar nova feature
- Scripts de bootstrap (new-feature.sh, new-function.sh)

Decisoes de design:
- Features nunca importam de outras features diretamente
- Componentes shadcn em ui/ nao devem ser modificados
- Componentes customizados vao em common/
- Anti-patterns documentados com exemplos

Proximos passos:
- docs/04-seguranca.md (RLS, OWASP, multi-tenancy)
- docs/05-testes.md (Vitest, TDD)
