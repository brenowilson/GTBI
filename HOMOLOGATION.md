# Checklist de Homologação iFood — GTBI

## Pré-requisitos (Ação Humana)

- [ ] Aplicação criada no [Developer Portal](https://developer.ifood.com.br/) com **CNPJ**
- [ ] Tipo da aplicação: **Centralizada** (suporta multi-loja + Webhooks)
- [ ] Módulos solicitados: **Merchant** + **Catalog**
- [ ] Módulos com status **Aprovado** no Developer Portal
- [ ] Loja de teste vinculada na aba "Permissões" do Developer Portal
- [ ] `IFOOD_CLIENT_ID` e `IFOOD_CLIENT_SECRET` configurados como Supabase secrets
- [ ] Fluxo de `userCode` funcionando (testar "Conectar Conta iFood" no admin)

## Status de Implementação

### Autenticação (Pré-requisito) ✅

| # | Requisito | Endpoint | Status | Arquivo |
|---|-----------|----------|--------|---------|
| A1 | Obter token (client_credentials) | `POST /oauth/token` | ✅ | `_shared/ifood-client.ts` → `exchangeToken()` |
| A2 | User code (device authorization) | `POST /oauth/userCode` | ✅ | `_shared/ifood-client.ts` → `requestUserCode()` |
| A3 | Refresh token | `POST /oauth/token` (refresh_token) | ✅ | `_shared/ifood-client.ts` → `refreshToken()` |
| A4 | Authorization code exchange | `POST /oauth/token` (authorization_code) | ✅ | `_shared/ifood-client.ts` → `exchangeToken()` |

### Módulo Merchant (Gestão de Lojas) — 2/8

| # | Requisito | Endpoint | Status | Arquivo |
|---|-----------|----------|--------|---------|
| M1 | Listar lojas vinculadas | `GET /merchant/v1.0/merchants` | ⚠️ | `_shared/ifood-client.ts` → `listRestaurants()` (path errado, usa `/{id}/restaurants`) |
| M2 | Detalhes da loja | `GET /merchants/{merchantId}` | ❌ | — |
| M3 | Status da loja | `GET /merchants/{merchantId}/status` | ❌ | — |
| M4 | Buscar horários | `GET /merchants/{merchantId}/opening-hours` | ❌ | — |
| M5 | Definir horários | `PUT /merchants/{merchantId}/opening-hours` | ❌ | — |
| M6 | Listar interrupções | `GET /merchants/{merchantId}/interruptions` | ❌ | — |
| M7 | Criar interrupção | `POST /merchants/{merchantId}/interruptions` | ❌ | — |
| M8 | Deletar interrupção | `DELETE /merchants/{merchantId}/interruptions/{id}` | ❌ | — |

### Módulo Catalog v2 (Gestão de Cardápio) — 0/10

| # | Requisito | Endpoint | Status | Arquivo |
|---|-----------|----------|--------|---------|
| C1 | Listar catálogos | `GET /catalog/v2.0/merchants/{merchantId}/catalogs` | ❌ | — |
| C2 | Listar categorias | `GET /catalogs/{catalogId}/categories` | ❌ | — |
| C3 | Criar categoria | `POST /catalogs/{catalogId}/categories` | ❌ | — |
| C4 | Criar/editar item completo | `PUT /merchants/{merchantId}/items` | ❌ | — |
| C5 | Alterar preço item | `PATCH /merchants/{merchantId}/items/price` | ❌ | — |
| C6 | Alterar status item | `PATCH /merchants/{merchantId}/items/status` | ❌ | — |
| C7 | Items por categoria | `GET /categories/{categoryId}/items` | ❌ | — |
| C8 | Alterar preço complemento | `PATCH /merchants/{merchantId}/options/price` | ❌ | — |
| C9 | Alterar status complemento | `PATCH /merchants/{merchantId}/options/status` | ❌ | — |
| C10 | Items vendáveis | `GET /catalogs/{catalogId}/sellableItems` | ❌ | — |

### Funcionalidades GTBI (não exigidas na homologação, mas parte do produto)

| Requisito | Endpoint | Status | Arquivo |
|-----------|----------|--------|---------|
| Buscar métricas de performance | `GET /restaurants/{id}/performance` | ✅ | `_shared/ifood-client.ts` → `getPerformanceMetrics()` |
| Buscar pedidos | `GET /restaurants/{id}/orders` | ✅ | `_shared/ifood-client.ts` → `getOrders()` |
| Buscar avaliações | `GET /restaurants/{id}/reviews` | ✅ | `_shared/ifood-client.ts` → `getReviews()` |
| Buscar chamados | `GET /restaurants/{id}/tickets` | ✅ | `_shared/ifood-client.ts` → `getTickets()` |
| Buscar financeiro | `GET /restaurants/{id}/financial` | ✅ | `_shared/ifood-client.ts` → `getFinancialEntries()` |
| Responder avaliação | `POST /reviews/{id}/response` | ✅ | `_shared/ifood-client.ts` → `respondToReview()` |
| Responder chamado | `POST /tickets/{id}/messages` | ✅ | `_shared/ifood-client.ts` → `respondToTicket()` |

## Ordem de Implementação Recomendada

### Fase 1 — Desbloquear conexão (URGENTE)
1. Resolver configuração no Developer Portal (ver "Pré-requisitos")
2. Corrigir `listRestaurants()` para usar `GET /merchants` (sem merchantId no path)
3. Implementar `getMerchantDetails()` → M2
4. Implementar `getMerchantStatus()` → M3
5. Testar fluxo completo: conectar conta → listar lojas → ver detalhes

### Fase 2 — Completar Merchant
6. Implementar `getOpeningHours()` → M4
7. Implementar `setOpeningHours()` → M5
8. Implementar `listInterruptions()` / `createInterruption()` / `deleteInterruption()` → M6-M8
9. Criar UI de gerenciamento de horários e interrupções

### Fase 3 — Implementar Catalog v2
10. Implementar `listCatalogs()` → C1
11. Implementar `listCategories()` → C2
12. Implementar `getItemsByCategory()` → C7
13. Implementar `getSellableItems()` → C10
14. Implementar `createCategory()` → C3
15. Implementar `createOrEditItem()` → C4
16. Implementar `changeItemPrice()` / `changeItemStatus()` → C5-C6
17. Implementar `changeOptionPrice()` / `changeOptionStatus()` → C8-C9
18. Criar UI completa de gerenciamento de catálogo

### Fase 4 — Pré-homologação
19. Testar todos os endpoints com loja real
20. Garantir que toda ação tem representação na UI (homologação testa o app, não só API)
21. Abrir ticket de homologação no Developer Portal

## Processo de Homologação

1. Abrir ticket em Developer Portal > Suporte > Tickets > "Solicitação de Homologação"
2. iFood agenda sessão de ~45 minutos
3. Analista iFood faz acesso remoto e testa cada funcionalidade
4. Se aprovado → app vira "integrador certificado" nos módulos
5. Se reprovado → corrigir problemas e reagendar

## Links Úteis

- [Developer Portal](https://developer.ifood.com.br/)
- [Critérios de Homologação](https://developer.ifood.com.br/en-US/docs/getting-started/homologation/criteria/)
- [Merchant Module](https://developer.ifood.com.br/en-US/docs/guides/modules/merchant/workflow/)
- [Catalog v2](https://developer.ifood.com.br/en-US/docs/guides/catalog/v2/)
- [Changelog](https://developer.ifood.com.br/pt-BR/docs/changelog/)
- [Rate Limits](https://developer.ifood.com.br/en-US/docs/rate-limit/)
