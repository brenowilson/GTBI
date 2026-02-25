[SESSION]
Timestamp: 2026-02-25T18:00-03:00
Solicitante: Breno

## Tarefa

Fix 401 error on report-generate-from-screenshots Edge Function, make report generation asynchronous (EdgeRuntime.waitUntil), add OpenAI API cost tracking (api_usage_logs table with 8 decimal places), enforce idempotency from frontend, and update UI to support "generating" status with Realtime updates.

## Arquivos Criados

- `supabase/migrations/20260225110000_async_reports_api_usage.sql` — Migration: api_usage_logs table, reports status ALTER (add "generating"), Realtime publication for reports

## Arquivos Modificados

- `supabase/config.toml` — Added `[functions.report-generate-from-screenshots]` with `verify_jwt = false` (fix 401)
- `supabase/functions/_shared/openai.ts` — Added `chatCompletionWithUsage()`, `estimateCost()`, `logApiUsage()`; refactored `chatCompletion()` as backward-compatible wrapper
- `supabase/functions/report-generate-from-screenshots/index.ts` — Major rewrite: async with `EdgeRuntime.waitUntil`, cost tracking, error handling with status updates
- `src/entities/report/model.ts` — Added "generating" to reportStatusSchema enum
- `src/entities/report/rules.ts` — Added `generating: ["generated", "failed"]` to VALID_TRANSITIONS
- `src/entities/report/rules.test.ts` — Added 3 tests for generating status transitions
- `src/shared/repositories/supabase/ReportRepository.ts` — Added `x-idempotency-key` header to `generateFromScreenshots()`
- `src/features/reports/hooks/useScreenshotReport.ts` — Updated success toast for async flow
- `src/features/reports/hooks/useReportRealtime.ts` — Removed restaurant_id filter, always enabled (supports screenshot reports without restaurant)
- `src/features/reports/components/CreateReportModal.tsx` — Allow closing during generation, updated spinner text
- `src/features/reports/components/ReportCard.tsx` — Added "Gerando..." label and orange style for generating status
- `src/features/reports/pages/ReportsPage.tsx` — Added "Gerando" filter option

## Verificacao de Consistencia

| Categoria | Doc | Status |
|-----------|-----|--------|
| Arquitetura | 01-arquitetura.md | OK - Clean Architecture layers respected |
| Seguranca | 04-seguranca.md | OK - RLS on api_usage_logs (service_role only), idempotency enforced |
| Testes | 05-testes.md | OK - 37 tests passing, new generating status tests added |
| Migrations | 06-migrations.md | OK - New migration created with proper naming |
| Design System | 02-design-system.md | OK - Used existing Badge/Card patterns, consistent status colors |

## Conclusao

All 4 objectives completed:
1. **401 fix**: Added Edge Function to config.toml
2. **Async generation**: EdgeRuntime.waitUntil pattern — handler returns immediately with "generating" status, background processes screenshots and updates via Realtime
3. **Idempotency**: Frontend sends x-idempotency-key header; backend checks via existing middleware
4. **Cost tracking**: New api_usage_logs table with NUMERIC(12,8) precision; chatCompletionWithUsage extracts token usage; estimateCost computes dollar cost; both Vision and actions calls logged

Build clean, lint clean (1 pre-existing warning), 37 tests passing.
