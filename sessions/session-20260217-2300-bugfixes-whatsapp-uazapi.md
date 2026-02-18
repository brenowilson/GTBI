[SESSION]
Timestamp: 2026-02-17T23:00-03:00
Solicitante: User

## Tarefa
Fix 9 critical bugs reported by user, integrate full WhatsApp instance management via Uazapi API, fix iFood parameter mismatches, fix invite flow issues, and add WhatsApp disconnect detection banner.

## Arquivos Criados
- src/features/admin/components/EditUserDialog.tsx — Dialog for editing user role and active status
- src/features/admin/components/ConnectIfoodAccountForm.tsx — Form for connecting iFood accounts
- src/features/admin/components/WhatsAppInstanceCard.tsx — Card displaying WhatsApp instance status
- src/features/admin/components/QRCodeModal.tsx — QR code display modal with 120s countdown
- src/features/admin/components/CreateInstanceForm.tsx — Form for creating new WhatsApp instances
- src/features/admin/hooks/useWhatsAppInstances.ts — 6 hooks for WhatsApp instance CRUD + polling
- src/entities/whatsapp-instance/model.ts — Zod schema for WhatsApp instance entity
- src/entities/whatsapp-instance/index.ts — Entity barrel export
- src/shared/repositories/interfaces/IWhatsAppInstanceRepository.ts — Repository interface
- src/shared/repositories/supabase/WhatsAppInstanceRepository.ts — Supabase implementation
- src/components/common/WhatsAppDisconnectBanner.tsx — Dismissable banner for disconnect detection
- src/components/ui/alert.tsx — shadcn/ui Alert component
- supabase/functions/whatsapp-instance/index.ts — Multi-action Edge Function (create/connect/status/disconnect/delete)
- supabase/migrations/20260217200011_whatsapp_instances.sql — Table + RLS + triggers
- generated/DEPLOY.md — Comprehensive post-deploy checklist

## Arquivos Modificados
- generated/admin-setup.sql — Fixed invalid CREATE POLICY IF NOT EXISTS syntax
- generated/email-templates/invite.html — Fixed expiry text: 48 horas → 7 dias
- src/components/layout/RestaurantSelector.tsx — Fixed "Conectar conta" link to /admin?tab=accounts
- src/components/layout/AppLayout.tsx — Added WhatsAppDisconnectBanner
- src/features/admin/pages/AdminPage.tsx — URL-driven tabs, edit dialog, iFood form, WhatsApp tab, notification composer updates
- src/features/admin/components/NotificationComposer.tsx — Multi-channel, audience filter, select all
- src/features/admin/hooks/index.ts — Added WhatsApp + role assignment exports
- src/features/admin/hooks/useUsers.ts — Added useUserRoleAssignments
- src/features/admin/hooks/useIfoodAccounts.ts — Fixed collectData signature, added refetchInterval
- src/features/admin/index.ts — Updated exports
- src/features/catalog/pages/CatalogPage.tsx — Renamed Catalogo → Cardapio
- src/features/onboarding/components/OnboardingOverlay.tsx — Renamed Catalogo → Cardapio
- src/entities/ifood-account/model.ts — Changed schema from authorization_code to client credentials
- src/shared/lib/api.ts — Fixed invokeFunction to not pass body: undefined
- src/shared/repositories/interfaces/IUserRepository.ts — Added UserRoleAssignment type
- src/shared/repositories/interfaces/IIfoodAccountRepository.ts — Fixed collectData signature
- src/shared/repositories/interfaces/index.ts — Updated exports
- src/shared/repositories/supabase/AdminRepository.ts — Fixed admin-stats to use GET method
- src/shared/repositories/supabase/IfoodAccountRepository.ts — Fixed param names: account_id → ifood_account_id
- src/shared/repositories/supabase/UserRepository.ts — Added getRoleAssignments
- src/shared/repositories/supabase/index.ts — Added whatsappInstanceRepository export
- supabase/functions/_shared/uazapi.ts — Full rewrite: fixed endpoints, headers, added instance management
- supabase/functions/report-send/index.ts — Updated to use instance token for WhatsApp sending
- supabase/functions/admin-send-notification/index.ts — Updated to use instance token
- supabase/functions/auth-accept-invite/index.ts — Role failure now rolls back, removed dead magic link code

## Verificacao de Consistencia

| Doc | Status | Notas |
|-----|--------|-------|
| 01-arquitetura.md | OK | Clean Architecture respected: entity → repository interface → implementation → hooks → components |
| 02-design-system.md | OK | Uses shadcn/ui components (Card, Dialog, Badge, Button, Alert), Tailwind classes |
| 04-seguranca.md | OK | RLS on whatsapp_instances (admin-only), instance_token not exposed to frontend |
| 06-migrations.md | OK | New migration follows sequential numbering (20260217200011) |
| 14-responsividade-mobile.md | OK | WhatsApp banner is mobile-responsive (bottom-20 on mobile, bottom-4 on desktop) |
| 15-pwa.md | OK | No service worker impact |
| 03-governanca.md | OK | Conventional commits used, session created |

## Verificacao de Sinergia
- [x] Migration follows sequential numbering
- [x] Edge Function follows existing patterns (withMiddleware, jsonResponse, audit logging)
- [x] Entity model follows Zod schema pattern
- [x] Repository follows interface → implementation pattern
- [x] Hooks follow React Query mutation/query pattern
- [x] Components follow shadcn/ui + Tailwind pattern
- [x] No broken cross-references

## Conclusao
Fixed all 9 user-reported bugs (admin-stats 401, edit user, notification composer, iFood connect, naming inconsistency, admin-setup.sql syntax, DEPLOY.md). Built complete WhatsApp instance management with Uazapi API integration including QR code authentication flow, auto-webhook configuration, disconnect detection banner, and proper instance token handling for message sending. Fixed critical iFood parameter mismatches that prevented sync/refresh from working. Fixed invite flow to fail properly on role assignment errors.
