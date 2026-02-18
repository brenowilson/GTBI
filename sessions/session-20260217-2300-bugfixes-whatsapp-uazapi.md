[SESSION]
Timestamp: 2026-02-17T23:00-03:00
Solicitante: User

## Tarefa
Fix critical bugs, integrate WhatsApp instance management via Uazapi API, fix iFood parameter mismatches, fix invite flow, add WhatsApp disconnect detection, fix 401 on Edge Functions, redesign WhatsApp UX, fix Roles tab, fix Profile button, add logging.

## Arquivos Criados
- src/features/admin/components/EditUserDialog.tsx — Dialog for editing user role and active status
- src/features/admin/components/ConnectIfoodAccountForm.tsx — Form for connecting iFood accounts (name + merchant_id only)
- src/features/admin/components/WhatsAppInstanceCard.tsx — Card displaying WhatsApp instance status
- src/features/admin/components/WhatsAppPanel.tsx — Redesigned single-click QR code flow (replaces CreateInstanceForm + complex flow)
- src/features/admin/components/QRCodeModal.tsx — QR code display modal with 120s countdown
- src/features/admin/components/CreateInstanceForm.tsx — Deprecated (replaced by WhatsAppPanel)
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
- src/components/layout/Header.tsx — Fixed Profile button to navigate to /settings
- src/features/admin/pages/AdminPage.tsx — URL-driven tabs, WhatsAppPanel, self-contained RoleMatrix, removed old WhatsApp state
- src/features/admin/components/NotificationComposer.tsx — Multi-channel, audience filter, select all
- src/features/admin/components/RoleMatrix.tsx — Complete rewrite: self-contained, fetches own data, create/delete roles, toggle permissions
- src/features/admin/hooks/index.ts — Added WhatsApp + role permissions hooks exports
- src/features/admin/hooks/useUsers.ts — Added useRolePermissions, useFeatures, useCreateRole, useDeleteRole, useTogglePermission
- src/features/admin/hooks/useIfoodAccounts.ts — Fixed collectData signature, added refetchInterval
- src/features/admin/index.ts — Updated exports
- src/features/catalog/pages/CatalogPage.tsx — Renamed Catalogo → Cardapio
- src/features/onboarding/components/OnboardingOverlay.tsx — Renamed Catalogo → Cardapio
- src/entities/ifood-account/model.ts — Simplified to name + merchant_id only
- src/shared/lib/api.ts — Rewritten: uses raw fetch() to bypass supabase.functions.invoke race condition, explicit Authorization header, structured error logging
- src/shared/repositories/interfaces/IUserRepository.ts — Added RolePermissionEntry, FeatureDefinition, createRole, deleteRole, getRolePermissions, getFeatures, grantPermission, revokePermission
- src/shared/repositories/interfaces/IIfoodAccountRepository.ts — Fixed collectData signature
- src/shared/repositories/interfaces/index.ts — Updated exports with new types
- src/shared/repositories/supabase/AdminRepository.ts — Fixed admin-stats to use GET method
- src/shared/repositories/supabase/IfoodAccountRepository.ts — Fixed param names, simplified connect
- src/shared/repositories/supabase/UserRepository.ts — Added createRole, deleteRole, getRolePermissions, getFeatures, grantPermission, revokePermission
- src/shared/repositories/supabase/index.ts — Added whatsappInstanceRepository export
- src/app/providers/AuthInitializer.tsx — Added error logging for profile/roles/permissions loading
- supabase/functions/_shared/uazapi.ts — Full rewrite: fixed endpoints, headers, added instance management
- supabase/functions/ifood-connect/index.ts — Reads credentials from env vars
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
| 14-responsividade-mobile.md | OK | WhatsApp panel is responsive |
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
Fixed all user-reported bugs. Key changes: (1) Resolved persistent 401 errors by rewriting invokeFunction() to use raw fetch() instead of supabase.functions.invoke(), bypassing the customFetch race condition that overwrote the Authorization header. (2) Redesigned WhatsApp tab with single-click QR code flow — no instance name needed, auto-creates behind the scenes. (3) Fixed Roles tab — now fetches real permissions from DB, supports creating/deleting roles and toggling CRUD permissions per feature. (4) Fixed Profile button to navigate to /settings. (5) Added structured error logging throughout auth flow and API calls. (6) Simplified iFood connect form (name + merchant_id only). (7) Previous fixes: parameter mismatches, invite flow rollback, Uazapi endpoint corrections, disconnect detection banner.
