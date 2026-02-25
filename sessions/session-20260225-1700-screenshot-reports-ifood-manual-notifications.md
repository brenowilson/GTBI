[SESSION]
Timestamp: 2026-02-25T17:00-03:00
Solicitante: Breno Wilson

## Tarefa

Implementar 4 mudancas no sistema GTBI:
1. Geracao de relatorios via upload de capturas de tela do painel iFood (AI Vision)
2. Adicao manual de contas iFood (sem OAuth, pendente homologacao)
3. Correcao de empilhamento de notificacoes (banners sobrepostos)
4. Correcao de visibilidade em dark mode (backgrounds transparentes)

## Arquivos Criados

| Arquivo | Descricao |
|---------|-----------|
| `src/components/common/NotificationStack.tsx` | Container flex-col para empilhamento de notificacoes |
| `src/features/admin/components/AddIfoodAccountForm.tsx` | Formulario para adicao manual de conta iFood (name + merchant_id) |
| `src/features/admin/useCases/addIfoodAccountManually.ts` | Use case com validacao Zod para adicao manual |
| `src/features/reports/components/ScreenshotUpload.tsx` | Upload drag & drop, click, clipboard paste com previews |
| `src/features/reports/components/CreateReportModal.tsx` | Dialog multi-step: upload → configurar → gerando |
| `src/features/reports/useCases/generateReportFromScreenshots.ts` | Use case para geracao de relatorio via screenshots |
| `src/features/reports/hooks/useScreenshotReport.ts` | Hooks useUploadScreenshots e useGenerateReportFromScreenshots |
| `supabase/functions/report-generate-from-screenshots/index.ts` | Edge Function: GPT-4o Vision extraction + HTML report generation |
| `supabase/migrations/20260225100000_report_screenshots.sql` | Migration: report_screenshots table, storage bucket, reports alterations |

## Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/common/InstallBanner.tsx` | Removida posicao fixa; bg-card → bg-background dark:bg-secondary |
| `src/components/common/WhatsAppDisconnectBanner.tsx` | Removida posicao fixa; adicionado dark:bg-destructive/20 |
| `src/components/common/OfflineIndicator.tsx` | Removida posicao fixa e transform |
| `src/components/common/index.ts` | Exportado NotificationStack |
| `src/components/layout/AppLayout.tsx` | Removido WhatsAppDisconnectBanner (movido para App.tsx) |
| `src/app/App.tsx` | Adicionado NotificationStack envolvendo todos os banners |
| `src/features/admin/components/ConnectIfoodAccountForm.tsx` | Substituido por card "Em breve" (OAuth bloqueado) |
| `src/features/admin/components/IfoodAccountCard.tsx` | Badge "Manual", botao "Conectar" desabilitado |
| `src/features/admin/hooks/useIfoodAccounts.ts` | Adicionado useAddIfoodAccountManually |
| `src/features/admin/hooks/index.ts` | Exportado useAddIfoodAccountManually |
| `src/features/admin/pages/AdminPage.tsx` | Adicionado AddIfoodAccountForm acima do ConnectIfoodAccountForm |
| `src/shared/repositories/interfaces/IIfoodAccountRepository.ts` | Adicionado metodo addManually |
| `src/shared/repositories/supabase/IfoodAccountRepository.ts` | Implementado addManually |
| `src/entities/report/model.ts` | Adicionado source, ifood_account_id, ReportScreenshot, GenerateFromScreenshotsInput |
| `src/entities/report/index.ts` | Exportados novos schemas e tipos |
| `src/entities/report/rules.test.ts` | Adicionado source ao mock |
| `src/shared/repositories/interfaces/IReportRepository.ts` | Adicionados metodos: getAllReports, uploadScreenshot, generateFromScreenshots, getScreenshots |
| `src/shared/repositories/supabase/ReportRepository.ts` | Implementados novos metodos |
| `src/features/reports/hooks/useReports.ts` | Adicionado useAllReports |
| `src/features/reports/hooks/index.ts` | Exportados novos hooks |
| `src/features/reports/useCases/index.ts` | Exportado generateReportFromScreenshots |
| `src/features/reports/index.ts` | Exportados novos componentes, hooks e use cases |
| `src/features/reports/pages/ReportsPage.tsx` | Botao "Adicionar Relatorio", suporte sem restaurante selecionado, CreateReportModal |
| `src/features/reports/components/ReportCard.tsx` | Badge "Via Capturas de Tela", restaurantName nullable |

## Verificacao de Consistencia

| Verificacao | Status | Notas |
|-------------|--------|-------|
| Clean Architecture | OK | Camadas respeitadas (entities → useCases → hooks → components) |
| Repository Pattern | OK | Interface + implementacao Supabase |
| Result Pattern | OK | Use case retorna Result<Report> |
| Zod Validation | OK | Schemas para inputs e entidades |
| RLS | OK | Migration inclui policies para report_screenshots e storage |
| Mobile-first | OK | Grid responsivo, Dialog max-w-2xl |
| Dark Mode | OK | NotificationStack com backgrounds solidos |
| English Code | OK | Variaveis, funcoes, tipos em ingles |
| Portuguese UI | OK | Labels, mensagens, placeholders em portugues |
| Build | OK | tsc + vite build sem erros |
| Lint | OK | ESLint sem erros (1 warning pre-existente) |
| Tests | OK | 34 testes passando (6 arquivos) |

## Detalhes Tecnicos

### Phase 1: Notificacoes
- NotificationStack: `fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 md:bottom-4 md:left-auto md:w-96`
- Banners individuais perderam posicao fixa (agora relative dentro do flex container)
- Dark mode: substituido bg-card (alpha) por bg-background dark:bg-secondary (solido)

### Phase 2: iFood Manual
- addManually insere em ifood_accounts sem tokens (access_token, refresh_token, token_expires_at = NULL)
- Auto-cria ifood_account_access para o usuario criador
- ConnectIfoodAccountForm mostra card "Em breve" com opacity-60

### Phase 3: Screenshot Reports
- reports.restaurant_id agora nullable (DROP NOT NULL)
- reports.source: 'api' | 'screenshots'
- reports.ifood_account_id: FK para ifood_accounts
- Storage bucket report-screenshots: privado, 10MB, image/* only
- Edge Function usa GPT-4o Vision com multi-image para extracao estruturada
- Dados extraidos: financial, funnel, operations, marketing, menu, customers, competition
- Fallback actions quando AI falha
- ReportsPage funciona sem restaurante selecionado (usa useAllReports)

## Conclusao

Todas as 4 mudancas implementadas com sucesso:
1. Screenshot reports: upload multi-modal, AI Vision extraction, HTML report generation, actions e checklist automaticos
2. Manual iFood accounts: formulario simples, inserção direta no banco, sem dependencia de OAuth
3. Notification stacking: flex container elimina sobreposicao
4. Dark mode: backgrounds solidos para legibilidade

Build, lint e testes passando. Pronto para commit e push.
