# GTBI Database Schema

## Overview

The GTBI (Gestao e Tecnologia para Business Intelligence) database runs on **Supabase (PostgreSQL)** and is organized around iFood restaurant management, BI reporting, and multi-tenant access control. The schema is split across 10 sequential migration files and follows these architectural principles:

- **RBAC (Role-Based Access Control)** via `roles`, `features`, `feature_actions`, `role_permissions`, and `user_roles` tables, enforced through helper functions (`user_can()`, `get_user_permissions()`).
- **Multi-tenant restaurant access** via the `ifood_account_access` junction table, enforced through `user_has_restaurant_access()`.
- **Row Level Security (RLS)** enabled on every single table, with policies that combine RBAC checks and restaurant-access checks.
- **Audit logging** via `audit_logs` table and a generic `audit_trigger()` function.
- **Automatic `updated_at` timestamps** via a reusable `update_updated_at()` trigger function.

All UUIDs use `gen_random_uuid()`. All timestamps are `TIMESTAMPTZ` with `DEFAULT now()`.

---

## Tables

### idempotency_keys

Tracks idempotent operations to prevent duplicate processing. Used by Edge Functions via `service_role`.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| key | TEXT | NOT NULL | - | Unique idempotency key |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Indexes:**
- `idx_idempotency_keys_key` on `(key)`
- `idx_idempotency_keys_created_at` on `(created_at)`

**RLS Policies:**
- `idempotency_keys_service_role_only` - FOR ALL TO authenticated USING (false) WITH CHECK (false) -- Blocks all authenticated users; only `service_role` can access.

**Triggers:** None

---

### audit_logs

Immutable audit trail for all critical actions. Rows are inserted by the `log_audit()` function or the `audit_trigger()` trigger function (both run as `SECURITY DEFINER`).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| user_id | UUID | YES | - | FK to `auth.users(id)` -- user who performed the action |
| action | TEXT | NOT NULL | - | Action type (e.g., 'create', 'update', 'delete') |
| entity | TEXT | NOT NULL | - | Table/entity name |
| entity_id | UUID | YES | - | ID of the affected row |
| old_data | JSONB | YES | - | Previous state (for updates/deletes) |
| new_data | JSONB | YES | - | New state (for inserts/updates) |
| ip_address | TEXT | YES | - | Client IP address |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | When the audit entry was created |

**Indexes:**
- `idx_audit_logs_user_id` on `(user_id)`
- `idx_audit_logs_entity` on `(entity, entity_id)`
- `idx_audit_logs_action` on `(action)`
- `idx_audit_logs_created_at` on `(created_at DESC)`

**RLS Policies:**
- `audit_logs_select_authenticated` - FOR SELECT TO authenticated USING (true) -- All authenticated users can read audit logs.
- `audit_logs_insert_service_role` - FOR INSERT TO authenticated USING (false) WITH CHECK (false) -- Blocks direct inserts from authenticated users; inserts happen via `SECURITY DEFINER` functions.

**Triggers:** None

---

### rate_limit_logs

Tracks API request rates for rate limiting. Used by middleware via `service_role`.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| user_id | UUID | YES | - | User who made the request |
| function_name | TEXT | YES | - | Name of the Edge Function called |
| ip_address | TEXT | YES | - | Client IP address |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | When the request was logged |

**Indexes:**
- `idx_rate_limit_logs_user_id` on `(user_id)`
- `idx_rate_limit_logs_function_name` on `(function_name, created_at)`
- `idx_rate_limit_logs_ip_address` on `(ip_address, created_at)`
- `idx_rate_limit_logs_created_at` on `(created_at)`

**RLS Policies:**
- `rate_limit_logs_service_role_only` - FOR ALL TO authenticated USING (false) WITH CHECK (false) -- Only `service_role` can access.

**Triggers:** None

---

### roles

RBAC roles. Contains at least one system role (`admin`).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| name | TEXT | NOT NULL | - | Unique role name |
| description | TEXT | YES | - | Human-readable description |
| is_system | BOOLEAN | NOT NULL | `false` | Whether this is a protected system role |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | `now()` | Last update timestamp |

**Indexes:** None (besides the UNIQUE constraint on `name`)

**RLS Policies:**
- `roles_select_authenticated` - FOR SELECT TO authenticated USING (true) -- All authenticated users can read roles.
- `roles_insert_admin` - FOR INSERT TO authenticated WITH CHECK (`user_can(auth.uid(), 'users', 'create')`)
- `roles_update_admin` - FOR UPDATE TO authenticated USING/WITH CHECK (`user_can(auth.uid(), 'users', 'update')`)
- `roles_delete_admin` - FOR DELETE TO authenticated USING (`user_can(auth.uid(), 'users', 'delete')`)

**Triggers:**
- `roles_updated_at` - BEFORE UPDATE, executes `update_updated_at()`

---

### feature_groups

Groups related features together (e.g., "users", "restaurants", "reports").

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| name | TEXT | NOT NULL | - | Unique group name |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Indexes:** None (besides the UNIQUE constraint on `name`)

**RLS Policies:**
- `feature_groups_select_authenticated` - FOR SELECT TO authenticated USING (true)
- `feature_groups_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'users', 'create')`)
- `feature_groups_update_admin` - FOR UPDATE USING/WITH CHECK (`user_can(auth.uid(), 'users', 'update')`)
- `feature_groups_delete_admin` - FOR DELETE USING (`user_can(auth.uid(), 'users', 'delete')`)

**Triggers:** None

---

### features

Individual features within feature groups. Each feature has a unique `code` used for permission checks.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| feature_group_id | UUID | YES | - | FK to `feature_groups(id)` ON DELETE CASCADE |
| name | TEXT | NOT NULL | - | Feature display name |
| code | TEXT | NOT NULL | - | Unique code used in `user_can()` checks |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Indexes:**
- `idx_features_feature_group_id` on `(feature_group_id)`

**RLS Policies:**
- `features_select_authenticated` - FOR SELECT TO authenticated USING (true)
- `features_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'users', 'create')`)
- `features_update_admin` - FOR UPDATE USING/WITH CHECK (`user_can(auth.uid(), 'users', 'update')`)
- `features_delete_admin` - FOR DELETE USING (`user_can(auth.uid(), 'users', 'delete')`)

**Triggers:** None

---

### feature_actions

CRUD actions available for each feature. Constrained to 'create', 'read', 'update', 'delete'.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| feature_id | UUID | YES | - | FK to `features(id)` ON DELETE CASCADE |
| action | TEXT | NOT NULL | - | One of: 'create', 'read', 'update', 'delete' |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Constraints:**
- CHECK: `action IN ('create', 'read', 'update', 'delete')`
- UNIQUE: `(feature_id, action)`

**Indexes:**
- `idx_feature_actions_feature_id` on `(feature_id)`

**RLS Policies:**
- `feature_actions_select_authenticated` - FOR SELECT TO authenticated USING (true)
- `feature_actions_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'users', 'create')`)
- `feature_actions_update_admin` - FOR UPDATE USING/WITH CHECK (`user_can(auth.uid(), 'users', 'update')`)
- `feature_actions_delete_admin` - FOR DELETE USING (`user_can(auth.uid(), 'users', 'delete')`)

**Triggers:** None

---

### role_permissions

Junction table linking roles to feature actions, defining what each role can do.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| role_id | UUID | YES | - | FK to `roles(id)` ON DELETE CASCADE |
| feature_action_id | UUID | YES | - | FK to `feature_actions(id)` ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Constraints:**
- UNIQUE: `(role_id, feature_action_id)`

**Indexes:**
- `idx_role_permissions_role_id` on `(role_id)`
- `idx_role_permissions_feature_action_id` on `(feature_action_id)`

**RLS Policies:**
- `role_permissions_select_authenticated` - FOR SELECT TO authenticated USING (true)
- `role_permissions_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'users', 'create')`)
- `role_permissions_update_admin` - FOR UPDATE USING/WITH CHECK (`user_can(auth.uid(), 'users', 'update')`)
- `role_permissions_delete_admin` - FOR DELETE USING (`user_can(auth.uid(), 'users', 'delete')`)

**Triggers:** None

---

### user_roles

Junction table assigning roles to users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| user_id | UUID | NOT NULL | - | FK to `auth.users(id)` ON DELETE CASCADE |
| role_id | UUID | NOT NULL | - | FK to `roles(id)` ON DELETE CASCADE |
| assigned_by | UUID | YES | - | FK to `auth.users(id)` -- who assigned this role |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Constraints:**
- UNIQUE: `(user_id, role_id)`

**Indexes:**
- `idx_user_roles_user_id` on `(user_id)`
- `idx_user_roles_role_id` on `(role_id)`

**RLS Policies:**
- `user_roles_select_own` - FOR SELECT TO authenticated USING (`user_id = auth.uid()`) -- Users can read their own roles.
- `user_roles_select_admin` - FOR SELECT TO authenticated USING (`user_can(auth.uid(), 'users', 'read')`) -- Admins can read all.
- `user_roles_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'users', 'create')`)
- `user_roles_update_admin` - FOR UPDATE USING/WITH CHECK (`user_can(auth.uid(), 'users', 'update')`)
- `user_roles_delete_admin` - FOR DELETE USING (`user_can(auth.uid(), 'users', 'delete')`)

**Triggers:** None

---

### user_profiles

Extended user profile data linked to `auth.users`. A row is automatically created via the `on_auth_user_created` trigger when a new user signs up.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | - | PK, FK to `auth.users(id)` ON DELETE CASCADE |
| email | TEXT | NOT NULL | - | Unique email address |
| full_name | TEXT | NOT NULL | - | User's display name |
| avatar_url | TEXT | YES | - | URL to profile picture |
| is_active | BOOLEAN | NOT NULL | `true` | Whether the user is active |
| theme_preference | TEXT | NOT NULL | `'light'` | One of: 'light', 'dark', 'system' |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | `now()` | Last update timestamp |

**Constraints:**
- CHECK: `theme_preference IN ('light', 'dark', 'system')`
- UNIQUE on `email`

**Indexes:**
- `idx_user_profiles_email` on `(email)`
- `idx_user_profiles_is_active` on `(is_active)`

**RLS Policies:**
- `user_profiles_select_own` - FOR SELECT TO authenticated USING (`id = auth.uid()`) -- Users can read their own profile.
- `user_profiles_select_admin` - FOR SELECT TO authenticated USING (`user_can(auth.uid(), 'users', 'read')`) -- Admins can read all.
- `user_profiles_update_own` - FOR UPDATE TO authenticated USING/WITH CHECK (`id = auth.uid()`) -- Users can update their own profile.
- `user_profiles_update_admin` - FOR UPDATE TO authenticated USING/WITH CHECK (`user_can(auth.uid(), 'users', 'update')`) -- Admins can update any.

**Triggers:**
- `user_profiles_updated_at` - BEFORE UPDATE, executes `update_updated_at()`

---

### invitations

Pending user invitations with expiration tokens. Invited users receive a token-based link to accept.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| email | TEXT | NOT NULL | - | Invitee email address |
| role_id | UUID | YES | - | FK to `roles(id)` -- role to assign on acceptance |
| invited_by | UUID | YES | - | FK to `auth.users(id)` -- who sent the invite |
| token | TEXT | NOT NULL | `encode(gen_random_bytes(32), 'hex')` | Unique invitation token (256-bit hex) |
| expires_at | TIMESTAMPTZ | NOT NULL | `now() + interval '7 days'` | Expiration timestamp |
| accepted_at | TIMESTAMPTZ | YES | - | When the invitation was accepted |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Indexes:**
- `idx_invitations_email` on `(email)`
- `idx_invitations_token` on `(token)`
- `idx_invitations_invited_by` on `(invited_by)`
- `idx_invitations_role_id` on `(role_id)`
- `idx_invitations_expires_at` on `(expires_at)`

**RLS Policies:**
- `invitations_select_admin` - FOR SELECT TO authenticated USING (`user_can(auth.uid(), 'users', 'read')`)
- `invitations_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'users', 'create')`)
- `invitations_update_admin` - FOR UPDATE USING/WITH CHECK (`user_can(auth.uid(), 'users', 'update')`)
- `invitations_delete_admin` - FOR DELETE USING (`user_can(auth.uid(), 'users', 'delete')`)

**Triggers:**
- `audit_invitations` - AFTER INSERT OR UPDATE OR DELETE, executes `audit_trigger()`

---

### ifood_accounts

iFood merchant accounts with OAuth tokens for API access.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| name | TEXT | NOT NULL | - | Display name for the account |
| merchant_id | TEXT | NOT NULL | - | iFood merchant identifier |
| is_active | BOOLEAN | NOT NULL | `true` | Whether the account is active |
| access_token | TEXT | YES | - | OAuth access token |
| refresh_token | TEXT | YES | - | OAuth refresh token |
| token_expires_at | TIMESTAMPTZ | YES | - | Token expiration timestamp |
| last_sync_at | TIMESTAMPTZ | YES | - | Last data synchronization timestamp |
| created_by | UUID | YES | - | FK to `auth.users(id)` -- who created the account |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | `now()` | Last update timestamp |

**Indexes:**
- `idx_ifood_accounts_merchant_id` on `(merchant_id)`
- `idx_ifood_accounts_is_active` on `(is_active)`
- `idx_ifood_accounts_created_by` on `(created_by)`

**RLS Policies:**
- `ifood_accounts_select_own` - FOR SELECT TO authenticated USING (id IN subquery of `ifood_account_access` for current user) -- Users see accounts they have access to.
- `ifood_accounts_select_admin` - FOR SELECT USING (`user_can(auth.uid(), 'restaurants', 'read')`)
- `ifood_accounts_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'restaurants', 'create')`)
- `ifood_accounts_update_admin` - FOR UPDATE USING/WITH CHECK (`user_can(auth.uid(), 'restaurants', 'update')`)
- `ifood_accounts_delete_admin` - FOR DELETE USING (`user_can(auth.uid(), 'restaurants', 'delete')`)

**Triggers:**
- `ifood_accounts_updated_at` - BEFORE UPDATE, executes `update_updated_at()`

---

### ifood_account_access

Junction table granting users access to specific iFood accounts. This is the foundation of the multi-tenant access model.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| ifood_account_id | UUID | NOT NULL | - | FK to `ifood_accounts(id)` ON DELETE CASCADE |
| user_id | UUID | NOT NULL | - | FK to `auth.users(id)` ON DELETE CASCADE |
| granted_by | UUID | YES | - | FK to `auth.users(id)` -- who granted access |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Constraints:**
- UNIQUE: `(ifood_account_id, user_id)`

**Indexes:**
- `idx_ifood_account_access_ifood_account_id` on `(ifood_account_id)`
- `idx_ifood_account_access_user_id` on `(user_id)`

**RLS Policies:**
- `ifood_account_access_select_own` - FOR SELECT TO authenticated USING (`user_id = auth.uid()`) -- Users can see their own access records.
- `ifood_account_access_select_admin` - FOR SELECT USING (`user_can(auth.uid(), 'restaurants', 'read')`)
- `ifood_account_access_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'restaurants', 'create')`)
- `ifood_account_access_delete_admin` - FOR DELETE USING (`user_can(auth.uid(), 'restaurants', 'delete')`)

**Triggers:** None

---

### restaurants

iFood restaurants linked to merchant accounts. Includes auto-reply configuration for reviews and tickets.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| ifood_account_id | UUID | NOT NULL | - | FK to `ifood_accounts(id)` ON DELETE CASCADE |
| ifood_restaurant_id | TEXT | NOT NULL | - | iFood restaurant identifier |
| name | TEXT | NOT NULL | - | Restaurant display name |
| address | TEXT | YES | - | Restaurant address |
| is_active | BOOLEAN | NOT NULL | `true` | Whether the restaurant is active |
| review_auto_reply_enabled | BOOLEAN | NOT NULL | `false` | Enable automatic review replies |
| review_auto_reply_mode | TEXT | NOT NULL | `'template'` | One of: 'template', 'ai' |
| review_reply_template | TEXT | YES | - | Template text for review replies |
| review_ai_prompt | TEXT | YES | - | AI prompt for review replies |
| ticket_auto_reply_enabled | BOOLEAN | NOT NULL | `false` | Enable automatic ticket replies |
| ticket_auto_reply_mode | TEXT | NOT NULL | `'template'` | One of: 'template', 'ai' |
| ticket_reply_template | TEXT | YES | - | Template text for ticket replies |
| ticket_ai_prompt | TEXT | YES | - | AI prompt for ticket replies |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | `now()` | Last update timestamp |

**Constraints:**
- CHECK: `review_auto_reply_mode IN ('template', 'ai')`
- CHECK: `ticket_auto_reply_mode IN ('template', 'ai')`
- UNIQUE: `(ifood_account_id, ifood_restaurant_id)`

**Indexes:**
- `idx_restaurants_ifood_account_id` on `(ifood_account_id)`
- `idx_restaurants_ifood_restaurant_id` on `(ifood_restaurant_id)`
- `idx_restaurants_is_active` on `(is_active)`

**RLS Policies:**
- `restaurants_select_own` - FOR SELECT TO authenticated USING (ifood_account_id IN subquery of `ifood_account_access` for current user)
- `restaurants_select_admin` - FOR SELECT USING (`user_can(auth.uid(), 'restaurants', 'read')`)
- `restaurants_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'restaurants', 'create')`)
- `restaurants_update_own` - FOR UPDATE USING/WITH CHECK (ifood_account_id IN subquery of `ifood_account_access` for current user)
- `restaurants_update_admin` - FOR UPDATE USING/WITH CHECK (`user_can(auth.uid(), 'restaurants', 'update')`)
- `restaurants_delete_admin` - FOR DELETE USING (`user_can(auth.uid(), 'restaurants', 'delete')`)

**Triggers:**
- `restaurants_updated_at` - BEFORE UPDATE, executes `update_updated_at()`

---

### restaurant_snapshots

Weekly performance snapshots for restaurants. Contains funnel metrics (visits, views, cart, checkout, completed).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| restaurant_id | UUID | NOT NULL | - | FK to `restaurants(id)` ON DELETE CASCADE |
| week_start | DATE | NOT NULL | - | Start of the reporting week |
| week_end | DATE | NOT NULL | - | End of the reporting week |
| visits | INT | NOT NULL | `0` | Number of store visits |
| views | INT | NOT NULL | `0` | Number of menu views |
| to_cart | INT | NOT NULL | `0` | Number of add-to-cart events |
| checkout | INT | NOT NULL | `0` | Number of checkout events |
| completed | INT | NOT NULL | `0` | Number of completed orders |
| cancellation_rate | NUMERIC(5,4) | NOT NULL | `0` | Order cancellation rate (0.0000-9.9999) |
| open_time_rate | NUMERIC(5,4) | NOT NULL | `0` | Rate the restaurant was open |
| open_tickets_rate | NUMERIC(5,4) | NOT NULL | `0` | Rate of open support tickets |
| new_customers_rate | NUMERIC(5,4) | NOT NULL | `0` | Rate of new customers |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Constraints:**
- UNIQUE: `(restaurant_id, week_start)`

**Indexes:**
- `idx_restaurant_snapshots_restaurant_id` on `(restaurant_id)`
- `idx_restaurant_snapshots_week_start` on `(week_start)`
- `idx_restaurant_snapshots_restaurant_week` on `(restaurant_id, week_start)`

**RLS Policies:**
- `restaurant_snapshots_select_own` - FOR SELECT USING (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `restaurant_snapshots_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'restaurants', 'create')`)

**Triggers:** None

---

### orders

iFood orders synced from merchant accounts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| restaurant_id | UUID | NOT NULL | - | FK to `restaurants(id)` ON DELETE CASCADE |
| ifood_order_id | TEXT | YES | - | Unique iFood order identifier |
| status | TEXT | YES | - | Order status |
| total | NUMERIC(10,2) | YES | - | Order total value |
| items_count | INT | YES | - | Number of items in the order |
| customer_name | TEXT | YES | - | Customer name |
| order_date | TIMESTAMPTZ | YES | - | When the order was placed |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Constraints:**
- UNIQUE on `ifood_order_id`

**Indexes:**
- `idx_orders_restaurant_id` on `(restaurant_id)`
- `idx_orders_ifood_order_id` on `(ifood_order_id)`
- `idx_orders_order_date` on `(order_date)`
- `idx_orders_status` on `(status)`
- `idx_orders_restaurant_date` on `(restaurant_id, order_date)`

**RLS Policies:**
- `orders_select_own` - FOR SELECT USING (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `orders_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'restaurants', 'create')`)

**Triggers:** None

---

### reviews

Customer reviews with auto-reply tracking. Supports manual, template, and AI response modes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| restaurant_id | UUID | NOT NULL | - | FK to `restaurants(id)` ON DELETE CASCADE |
| ifood_review_id | TEXT | YES | - | Unique iFood review identifier |
| order_id | TEXT | YES | - | Related order ID (iFood) |
| rating | INT | YES | - | Rating from 1 to 5 |
| comment | TEXT | YES | - | Customer review text |
| customer_name | TEXT | YES | - | Customer name |
| review_date | TIMESTAMPTZ | YES | - | When the review was posted |
| response | TEXT | YES | - | Reply text sent to customer |
| response_sent_at | TIMESTAMPTZ | YES | - | When the response was sent |
| response_mode | TEXT | YES | - | One of: 'manual', 'template', 'ai' |
| response_status | TEXT | YES | - | One of: 'pending', 'sent', 'failed' |
| response_error | TEXT | YES | - | Error message if response failed |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | `now()` | Last update timestamp |

**Constraints:**
- CHECK: `rating >= 1 AND rating <= 5`
- CHECK: `response_mode IN ('manual', 'template', 'ai')`
- CHECK: `response_status IN ('pending', 'sent', 'failed')`
- UNIQUE on `ifood_review_id`

**Indexes:**
- `idx_reviews_restaurant_id` on `(restaurant_id)`
- `idx_reviews_ifood_review_id` on `(ifood_review_id)`
- `idx_reviews_review_date` on `(review_date)`
- `idx_reviews_rating` on `(rating)`
- `idx_reviews_response_status` on `(response_status)`
- `idx_reviews_restaurant_date` on `(restaurant_id, review_date)`

**RLS Policies:**
- `reviews_select_own` - FOR SELECT USING (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `reviews_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'reviews', 'create')`)
- `reviews_update_own` - FOR UPDATE USING/WITH CHECK (`user_has_restaurant_access(auth.uid(), restaurant_id)`)

**Triggers:**
- `reviews_updated_at` - BEFORE UPDATE, executes `update_updated_at()`

---

### tickets

Customer support tickets from iFood.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| restaurant_id | UUID | NOT NULL | - | FK to `restaurants(id)` ON DELETE CASCADE |
| ifood_ticket_id | TEXT | YES | - | Unique iFood ticket identifier |
| order_id | TEXT | YES | - | Related order ID |
| subject | TEXT | YES | - | Ticket subject |
| status | TEXT | NOT NULL | `'open'` | One of: 'open', 'in_progress', 'resolved', 'closed' |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | `now()` | Last update timestamp |

**Constraints:**
- CHECK: `status IN ('open', 'in_progress', 'resolved', 'closed')`
- UNIQUE on `ifood_ticket_id`

**Indexes:**
- `idx_tickets_restaurant_id` on `(restaurant_id)`
- `idx_tickets_ifood_ticket_id` on `(ifood_ticket_id)`
- `idx_tickets_status` on `(status)`
- `idx_tickets_restaurant_status` on `(restaurant_id, status)`

**RLS Policies:**
- `tickets_select_own` - FOR SELECT USING (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `tickets_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'tickets', 'create')`)
- `tickets_update_own` - FOR UPDATE USING/WITH CHECK (`user_has_restaurant_access(auth.uid(), restaurant_id)`)

**Triggers:**
- `tickets_updated_at` - BEFORE UPDATE, executes `update_updated_at()`

---

### ticket_messages

Messages within support tickets. Can originate from customer, restaurant, or system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| ticket_id | UUID | NOT NULL | - | FK to `tickets(id)` ON DELETE CASCADE |
| ifood_message_id | TEXT | YES | - | iFood message identifier |
| sender | TEXT | YES | - | One of: 'customer', 'restaurant', 'system' |
| content | TEXT | NOT NULL | - | Message text |
| response_mode | TEXT | YES | - | One of: 'manual', 'template', 'ai' |
| response_status | TEXT | YES | - | One of: 'pending', 'sent', 'failed' |
| response_error | TEXT | YES | - | Error message if send failed |
| sent_at | TIMESTAMPTZ | YES | - | When the message was sent |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Constraints:**
- CHECK: `sender IN ('customer', 'restaurant', 'system')`
- CHECK: `response_mode IN ('manual', 'template', 'ai')`
- CHECK: `response_status IN ('pending', 'sent', 'failed')`

**Indexes:**
- `idx_ticket_messages_ticket_id` on `(ticket_id)`
- `idx_ticket_messages_sender` on `(sender)`
- `idx_ticket_messages_response_status` on `(response_status)`

**RLS Policies:**
- `ticket_messages_select_own` - FOR SELECT USING (ticket_id IN subquery of tickets where `user_has_restaurant_access`)
- `ticket_messages_insert_own` - FOR INSERT WITH CHECK (ticket_id IN subquery of tickets where `user_has_restaurant_access`)

**Triggers:** None

---

### financial_entries

Financial transactions (revenue, fees, commissions, etc.) synced from iFood.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| restaurant_id | UUID | NOT NULL | - | FK to `restaurants(id)` ON DELETE CASCADE |
| ifood_entry_id | TEXT | YES | - | iFood financial entry identifier |
| entry_type | TEXT | YES | - | One of: 'revenue', 'fee', 'promotion', 'refund', 'adjustment', 'delivery_fee', 'commission', 'other' |
| description | TEXT | YES | - | Description of the entry |
| amount | NUMERIC(12,2) | NOT NULL | - | Monetary amount |
| reference_date | DATE | NOT NULL | - | Date the entry refers to |
| order_id | TEXT | YES | - | Related order ID |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Constraints:**
- CHECK: `entry_type IN ('revenue', 'fee', 'promotion', 'refund', 'adjustment', 'delivery_fee', 'commission', 'other')`

**Indexes:**
- `idx_financial_entries_restaurant_id` on `(restaurant_id)`
- `idx_financial_entries_reference_date` on `(reference_date)`
- `idx_financial_entries_entry_type` on `(entry_type)`
- `idx_financial_entries_restaurant_date` on `(restaurant_id, reference_date)`
- `idx_financial_entries_ifood_entry_id` on `(ifood_entry_id)`

**RLS Policies:**
- `financial_entries_select_own` - FOR SELECT USING (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `financial_entries_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'financial', 'create')`)

**Triggers:** None

---

### catalog_categories

Menu categories for restaurant catalogs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| restaurant_id | UUID | NOT NULL | - | FK to `restaurants(id)` ON DELETE CASCADE |
| ifood_category_id | TEXT | YES | - | iFood category identifier |
| name | TEXT | NOT NULL | - | Category display name |
| sort_order | INT | NOT NULL | `0` | Display ordering |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Indexes:**
- `idx_catalog_categories_restaurant_id` on `(restaurant_id)`
- `idx_catalog_categories_ifood_category_id` on `(ifood_category_id)`

**RLS Policies:**
- `catalog_categories_select_own` - FOR SELECT USING (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `catalog_categories_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'catalog', 'create')`)
- `catalog_categories_update_own` - FOR UPDATE USING/WITH CHECK (`user_has_restaurant_access(auth.uid(), restaurant_id)`)

**Triggers:** None

---

### catalog_items

Individual menu items in restaurant catalogs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| restaurant_id | UUID | NOT NULL | - | FK to `restaurants(id)` ON DELETE CASCADE |
| ifood_item_id | TEXT | YES | - | Unique iFood item identifier |
| category_id | UUID | YES | - | FK to `catalog_categories(id)` |
| category_name | TEXT | YES | - | Denormalized category name |
| name | TEXT | NOT NULL | - | Item display name |
| description | TEXT | YES | - | Item description |
| price | NUMERIC(10,2) | YES | - | Item price |
| image_url | TEXT | YES | - | URL to item image |
| is_available | BOOLEAN | NOT NULL | `true` | Whether the item is available |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | `now()` | Last update timestamp |

**Constraints:**
- UNIQUE on `ifood_item_id`

**Indexes:**
- `idx_catalog_items_restaurant_id` on `(restaurant_id)`
- `idx_catalog_items_category_id` on `(category_id)`
- `idx_catalog_items_ifood_item_id` on `(ifood_item_id)`
- `idx_catalog_items_is_available` on `(is_available)`

**RLS Policies:**
- `catalog_items_select_own` - FOR SELECT USING (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `catalog_items_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'catalog', 'create')`)
- `catalog_items_update_own` - FOR UPDATE USING/WITH CHECK (`user_has_restaurant_access(auth.uid(), restaurant_id)`)

**Triggers:**
- `catalog_items_updated_at` - BEFORE UPDATE, executes `update_updated_at()`

---

### data_collection_logs

Logs for automated data collection runs from iFood API.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| restaurant_id | UUID | NOT NULL | - | FK to `restaurants(id)` ON DELETE CASCADE |
| collection_type | TEXT | NOT NULL | - | Type of data collection (e.g., orders, reviews, financial) |
| status | TEXT | YES | - | One of: 'success', 'failed' |
| items_collected | INT | NOT NULL | `0` | Number of items collected |
| error_message | TEXT | YES | - | Error message if collection failed |
| started_at | TIMESTAMPTZ | YES | - | When collection started |
| completed_at | TIMESTAMPTZ | YES | - | When collection completed |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Constraints:**
- CHECK: `status IN ('success', 'failed')`

**Indexes:**
- `idx_data_collection_logs_restaurant_id` on `(restaurant_id)`
- `idx_data_collection_logs_collection_type` on `(collection_type)`
- `idx_data_collection_logs_status` on `(status)`
- `idx_data_collection_logs_created_at` on `(created_at DESC)`

**RLS Policies:**
- `data_collection_logs_select_own` - FOR SELECT USING (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `data_collection_logs_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'restaurants', 'create')`)

**Triggers:** None

---

### reports

Weekly BI reports with PDF generation and delivery tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| restaurant_id | UUID | NOT NULL | - | FK to `restaurants(id)` ON DELETE CASCADE |
| week_start | DATE | NOT NULL | - | Start of the reporting week |
| week_end | DATE | NOT NULL | - | End of the reporting week |
| status | TEXT | NOT NULL | `'generated'` | One of: 'generated', 'sending', 'sent', 'failed' |
| pdf_url | TEXT | YES | - | URL to the generated PDF in storage |
| pdf_hash | TEXT | YES | - | Hash of the PDF file for integrity checks |
| generated_at | TIMESTAMPTZ | YES | - | When the PDF was generated |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | `now()` | Last update timestamp |

**Constraints:**
- CHECK: `status IN ('generated', 'sending', 'sent', 'failed')`
- UNIQUE: `(restaurant_id, week_start)`

**Indexes:**
- `idx_reports_restaurant_id` on `(restaurant_id)`
- `idx_reports_week_start` on `(week_start)`
- `idx_reports_status` on `(status)`
- `idx_reports_restaurant_week` on `(restaurant_id, week_start)`

**RLS Policies:**
- `reports_select_own` - FOR SELECT USING (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `reports_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'reports', 'create')`)
- `reports_update_own` - FOR UPDATE USING/WITH CHECK (`user_has_restaurant_access(auth.uid(), restaurant_id)`)

**Triggers:**
- `reports_updated_at` - BEFORE UPDATE, executes `update_updated_at()`
- `audit_reports` - AFTER INSERT OR UPDATE OR DELETE, executes `audit_trigger()`

---

### report_send_logs

Log of report delivery attempts via email or WhatsApp.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| report_id | UUID | NOT NULL | - | FK to `reports(id)` ON DELETE CASCADE |
| sent_by | UUID | YES | - | FK to `auth.users(id)` -- who initiated the send |
| channel | TEXT | YES | - | One of: 'email', 'whatsapp' |
| status | TEXT | NOT NULL | `'pending'` | One of: 'pending', 'sent', 'failed' |
| error_message | TEXT | YES | - | Error message if delivery failed |
| sent_at | TIMESTAMPTZ | YES | - | When the report was sent |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Constraints:**
- CHECK: `channel IN ('email', 'whatsapp')`
- CHECK: `status IN ('pending', 'sent', 'failed')`

**Indexes:**
- `idx_report_send_logs_report_id` on `(report_id)`
- `idx_report_send_logs_status` on `(status)`
- `idx_report_send_logs_channel` on `(channel)`

**RLS Policies:**
- `report_send_logs_select_own` - FOR SELECT USING (report_id IN subquery of reports where `user_has_restaurant_access`)
- `report_send_logs_insert_own` - FOR INSERT WITH CHECK (report_id IN subquery of reports where `user_has_restaurant_access`)

**Triggers:** None

---

### report_internal_content

Internal analysis content for reports. This is not sent to clients -- it is for internal team use.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| report_id | UUID | NOT NULL | - | FK to `reports(id)` ON DELETE CASCADE |
| content | TEXT | NOT NULL | - | Internal analysis content |
| updated_by | UUID | YES | - | FK to `auth.users(id)` -- who last updated |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | `now()` | Last update timestamp |

**Indexes:**
- `idx_report_internal_content_report_id` on `(report_id)`

**RLS Policies:**
- `report_internal_content_select_own` - FOR SELECT USING (report_id IN subquery of reports where `user_has_restaurant_access`)
- `report_internal_content_insert_own` - FOR INSERT WITH CHECK (report_id IN subquery of reports where `user_has_restaurant_access`)
- `report_internal_content_update_own` - FOR UPDATE USING/WITH CHECK (report_id IN subquery of reports where `user_has_restaurant_access`)

**Triggers:**
- `report_internal_content_updated_at` - BEFORE UPDATE, executes `update_updated_at()`

---

### actions

Recommended actions from reports with status tracking. Actions can be marked as done (with evidence) or discarded (with reason).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| report_id | UUID | YES | - | FK to `reports(id)` -- the report that generated this action |
| restaurant_id | UUID | NOT NULL | - | FK to `restaurants(id)` ON DELETE CASCADE |
| week_start | DATE | NOT NULL | - | Week this action relates to |
| title | TEXT | NOT NULL | - | Action title |
| description | TEXT | YES | - | Detailed description |
| goal | TEXT | YES | - | Goal or expected outcome |
| action_type | TEXT | NOT NULL | - | One of: 'menu_adjustment', 'promotion', 'response', 'operational', 'marketing', 'other' |
| payload | JSONB | YES | - | Additional structured data |
| target | TEXT | YES | - | Target metric or entity |
| status | TEXT | NOT NULL | `'planned'` | One of: 'planned', 'done', 'discarded' |
| done_evidence | TEXT | YES | - | Evidence that the action was completed |
| done_by | UUID | YES | - | FK to `auth.users(id)` -- who marked as done |
| done_at | TIMESTAMPTZ | YES | - | When the action was completed |
| discarded_reason | TEXT | YES | - | Reason for discarding the action |
| discarded_by | UUID | YES | - | FK to `auth.users(id)` -- who discarded |
| discarded_at | TIMESTAMPTZ | YES | - | When the action was discarded |
| created_by | UUID | NOT NULL | - | FK to `auth.users(id)` -- who created the action |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | `now()` | Last update timestamp |

**Constraints:**
- CHECK: `action_type IN ('menu_adjustment', 'promotion', 'response', 'operational', 'marketing', 'other')`
- CHECK: `status IN ('planned', 'done', 'discarded')`

**Indexes:**
- `idx_actions_report_id` on `(report_id)`
- `idx_actions_restaurant_id` on `(restaurant_id)`
- `idx_actions_week_start` on `(week_start)`
- `idx_actions_status` on `(status)`
- `idx_actions_action_type` on `(action_type)`
- `idx_actions_restaurant_week` on `(restaurant_id, week_start)`

**RLS Policies:**
- `actions_select_own` - FOR SELECT USING (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `actions_insert_own` - FOR INSERT WITH CHECK (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `actions_update_own` - FOR UPDATE USING/WITH CHECK (`user_has_restaurant_access(auth.uid(), restaurant_id)`)

**Triggers:**
- `actions_updated_at` - BEFORE UPDATE, executes `update_updated_at()`
- `audit_actions` - AFTER INSERT OR UPDATE OR DELETE, executes `audit_trigger()`

---

### checklists

Weekly checklist items tied to reports. Can be checked off by users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| report_id | UUID | YES | - | FK to `reports(id)` |
| restaurant_id | UUID | YES | - | FK to `restaurants(id)` ON DELETE CASCADE |
| week_start | DATE | YES | - | Week this checklist item relates to |
| title | TEXT | NOT NULL | - | Checklist item title |
| is_checked | BOOLEAN | NOT NULL | `false` | Whether the item is checked |
| checked_by | UUID | YES | - | FK to `auth.users(id)` -- who checked it |
| checked_at | TIMESTAMPTZ | YES | - | When the item was checked |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Indexes:**
- `idx_checklists_report_id` on `(report_id)`
- `idx_checklists_restaurant_id` on `(restaurant_id)`
- `idx_checklists_week_start` on `(week_start)`

**RLS Policies:**
- `checklists_select_own` - FOR SELECT USING (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `checklists_insert_own` - FOR INSERT WITH CHECK (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `checklists_update_own` - FOR UPDATE USING/WITH CHECK (`user_has_restaurant_access(auth.uid(), restaurant_id)`)

**Triggers:** None

---

### image_jobs

AI-powered image generation and improvement jobs for catalog items.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| catalog_item_id | UUID | YES | - | FK to `catalog_items(id)` |
| restaurant_id | UUID | NOT NULL | - | FK to `restaurants(id)` ON DELETE CASCADE |
| mode | TEXT | NOT NULL | - | One of: 'improve_existing', 'from_image', 'from_description', 'from_new_description', 'direct_upload' |
| status | TEXT | NOT NULL | `'generating'` | One of: 'generating', 'ready_for_approval', 'approved', 'applied_to_catalog', 'rejected', 'archived', 'failed' |
| prompt | TEXT | YES | - | AI generation prompt |
| source_image_url | TEXT | YES | - | URL of the source image (for improve/from_image modes) |
| generated_image_url | TEXT | YES | - | URL of the generated image |
| new_description | TEXT | YES | - | Updated item description |
| created_by | UUID | NOT NULL | - | FK to `auth.users(id)` -- who initiated the job |
| approved_by | UUID | YES | - | FK to `auth.users(id)` -- who approved |
| approved_at | TIMESTAMPTZ | YES | - | When the job was approved |
| applied_at | TIMESTAMPTZ | YES | - | When the image was applied to the catalog |
| error_message | TEXT | YES | - | Error message if generation failed |
| retry_count | INT | NOT NULL | `0` | Number of retry attempts |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | `now()` | Last update timestamp |

**Constraints:**
- CHECK: `mode IN ('improve_existing', 'from_image', 'from_description', 'from_new_description', 'direct_upload')`
- CHECK: `status IN ('generating', 'ready_for_approval', 'approved', 'applied_to_catalog', 'rejected', 'archived', 'failed')`

**Indexes:**
- `idx_image_jobs_catalog_item_id` on `(catalog_item_id)`
- `idx_image_jobs_restaurant_id` on `(restaurant_id)`
- `idx_image_jobs_status` on `(status)`
- `idx_image_jobs_mode` on `(mode)`
- `idx_image_jobs_created_by` on `(created_by)`
- `idx_image_jobs_created_at` on `(created_at DESC)`

**RLS Policies:**
- `image_jobs_select_own` - FOR SELECT USING (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `image_jobs_insert_own` - FOR INSERT WITH CHECK (`user_has_restaurant_access(auth.uid(), restaurant_id)`)
- `image_jobs_update_own` - FOR UPDATE USING/WITH CHECK (`user_has_restaurant_access(auth.uid(), restaurant_id)`)

**Triggers:**
- `image_jobs_updated_at` - BEFORE UPDATE, executes `update_updated_at()`

---

### image_job_logs

Audit log of actions taken on image generation jobs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| image_job_id | UUID | NOT NULL | - | FK to `image_jobs(id)` ON DELETE CASCADE |
| action | TEXT | NOT NULL | - | Description of the action performed |
| performed_by | UUID | YES | - | FK to `auth.users(id)` |
| details | JSONB | YES | - | Additional structured details |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Indexes:**
- `idx_image_job_logs_image_job_id` on `(image_job_id)`
- `idx_image_job_logs_action` on `(action)`
- `idx_image_job_logs_performed_by` on `(performed_by)`

**RLS Policies:**
- `image_job_logs_select_own` - FOR SELECT USING (image_job_id IN subquery of image_jobs where `user_has_restaurant_access`)
- `image_job_logs_insert_own` - FOR INSERT WITH CHECK (image_job_id IN subquery of image_jobs where `user_has_restaurant_access`)

**Triggers:** None

---

### admin_notifications

Admin-sent notifications to users via email or WhatsApp.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| title | TEXT | NOT NULL | - | Notification title |
| body | TEXT | NOT NULL | - | Notification body text |
| channel | TEXT | NOT NULL | - | One of: 'email', 'whatsapp' |
| recipient_user_id | UUID | YES | - | FK to `auth.users(id)` -- target user |
| sent_by | UUID | NOT NULL | - | FK to `auth.users(id)` -- admin who sent it |
| status | TEXT | NOT NULL | `'pending'` | One of: 'pending', 'sent', 'failed' |
| error_message | TEXT | YES | - | Error message if sending failed |
| sent_at | TIMESTAMPTZ | YES | - | When the notification was sent |
| created_at | TIMESTAMPTZ | NOT NULL | `now()` | Creation timestamp |

**Constraints:**
- CHECK: `channel IN ('email', 'whatsapp')`
- CHECK: `status IN ('pending', 'sent', 'failed')`

**Indexes:**
- `idx_admin_notifications_recipient_user_id` on `(recipient_user_id)`
- `idx_admin_notifications_sent_by` on `(sent_by)`
- `idx_admin_notifications_status` on `(status)`
- `idx_admin_notifications_channel` on `(channel)`
- `idx_admin_notifications_created_at` on `(created_at DESC)`

**RLS Policies:**
- `admin_notifications_select_admin` - FOR SELECT USING (`user_can(auth.uid(), 'users', 'read')`)
- `admin_notifications_insert_admin` - FOR INSERT WITH CHECK (`user_can(auth.uid(), 'users', 'create')`)
- `admin_notifications_update_admin` - FOR UPDATE USING/WITH CHECK (`user_can(auth.uid(), 'users', 'update')`)
- `admin_notifications_delete_admin` - FOR DELETE USING (`user_can(auth.uid(), 'users', 'delete')`)

**Triggers:** None

---

## Functions

### update_updated_at()

- **Parameters:** None (trigger function)
- **Returns:** TRIGGER
- **Language:** plpgsql
- **Security:** Default (INVOKER)
- **Description:** Sets `NEW.updated_at = now()` on every row update. Used as a BEFORE UPDATE trigger on most tables that have an `updated_at` column.

### log_audit(p_action, p_entity, p_entity_id, p_old_data, p_new_data, p_ip_address)

- **Parameters:**
  - `p_action TEXT` -- Action type (e.g., 'create', 'update', 'delete')
  - `p_entity TEXT` -- Table/entity name
  - `p_entity_id UUID DEFAULT NULL` -- ID of the affected row
  - `p_old_data JSONB DEFAULT NULL` -- Previous state
  - `p_new_data JSONB DEFAULT NULL` -- New state
  - `p_ip_address TEXT DEFAULT NULL` -- Client IP
- **Returns:** UUID (the ID of the new audit_logs row)
- **Language:** plpgsql
- **Security:** SECURITY DEFINER
- **Description:** Inserts a record into `audit_logs` for tracking changes. Uses `auth.uid()` to capture the current user. Runs as SECURITY DEFINER to bypass RLS on `audit_logs`.

### audit_trigger()

- **Parameters:** None (trigger function)
- **Returns:** TRIGGER
- **Language:** plpgsql
- **Security:** SECURITY DEFINER
- **Description:** Generic trigger function that logs INSERT, UPDATE, and DELETE operations to `audit_logs` via `log_audit()`. Captures `to_jsonb(OLD)` and `to_jsonb(NEW)` as appropriate for the operation type.

### handle_new_user()

- **Parameters:** None (trigger function)
- **Returns:** TRIGGER
- **Language:** plpgsql
- **Security:** SECURITY DEFINER
- **Description:** Automatically creates a `user_profiles` row when a new `auth.users` row is inserted. Sets `full_name` from `raw_user_meta_data->>'full_name'` or falls back to the email address.

### user_can(p_user_id, p_feature_code, p_action)

- **Parameters:**
  - `p_user_id UUID` -- The user to check
  - `p_feature_code TEXT` -- Feature code (e.g., 'users', 'restaurants', 'reports')
  - `p_action TEXT` -- Action (e.g., 'create', 'read', 'update', 'delete')
- **Returns:** BOOLEAN
- **Language:** plpgsql
- **Security:** SECURITY DEFINER, STABLE
- **Description:** Checks if a user has permission to perform a specific action on a feature. System admins (role name = 'admin', is_system = true) automatically get all permissions. For non-admin users, it traverses `user_roles -> role_permissions -> feature_actions -> features` to find a matching grant.

### get_user_permissions(p_user_id)

- **Parameters:**
  - `p_user_id UUID` -- The user to query
- **Returns:** TABLE (feature_code TEXT, action TEXT)
- **Language:** plpgsql
- **Security:** SECURITY DEFINER, STABLE
- **Description:** Returns all permissions (feature_code, action pairs) for a user. If the user is a system admin, returns ALL feature_code/action combinations. Otherwise, returns only the explicitly granted permissions via role assignments.

### user_has_restaurant_access(p_user_id, p_restaurant_id)

- **Parameters:**
  - `p_user_id UUID` -- The user to check
  - `p_restaurant_id UUID` -- The restaurant to check access for
- **Returns:** BOOLEAN
- **Language:** plpgsql
- **Security:** SECURITY DEFINER, STABLE
- **Description:** Checks if a user has access to a specific restaurant. System admins get access to all restaurants. For non-admin users, it checks the access chain: `restaurants -> ifood_accounts -> ifood_account_access` to see if the user has been granted access to the iFood account that owns the restaurant.

---

## Triggers

### Reusable updated_at triggers

| Trigger Name | Table | Event | Function |
|-------------|-------|-------|----------|
| `roles_updated_at` | roles | BEFORE UPDATE | `update_updated_at()` |
| `user_profiles_updated_at` | user_profiles | BEFORE UPDATE | `update_updated_at()` |
| `ifood_accounts_updated_at` | ifood_accounts | BEFORE UPDATE | `update_updated_at()` |
| `restaurants_updated_at` | restaurants | BEFORE UPDATE | `update_updated_at()` |
| `reviews_updated_at` | reviews | BEFORE UPDATE | `update_updated_at()` |
| `tickets_updated_at` | tickets | BEFORE UPDATE | `update_updated_at()` |
| `catalog_items_updated_at` | catalog_items | BEFORE UPDATE | `update_updated_at()` |
| `reports_updated_at` | reports | BEFORE UPDATE | `update_updated_at()` |
| `report_internal_content_updated_at` | report_internal_content | BEFORE UPDATE | `update_updated_at()` |
| `actions_updated_at` | actions | BEFORE UPDATE | `update_updated_at()` |
| `image_jobs_updated_at` | image_jobs | BEFORE UPDATE | `update_updated_at()` |

### Audit triggers

| Trigger Name | Table | Event | Function |
|-------------|-------|-------|----------|
| `audit_invitations` | invitations | AFTER INSERT OR UPDATE OR DELETE | `audit_trigger()` |
| `audit_reports` | reports | AFTER INSERT OR UPDATE OR DELETE | `audit_trigger()` |
| `audit_actions` | actions | AFTER INSERT OR UPDATE OR DELETE | `audit_trigger()` |

### Auth triggers

| Trigger Name | Table | Event | Function |
|-------------|-------|-------|----------|
| `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` |

---

## Enums / Custom Types

The schema does not use PostgreSQL `CREATE TYPE` enums. Instead, all constrained values are enforced via `CHECK` constraints on TEXT columns. Below is a summary of all constrained values:

| Column(s) | Allowed Values |
|-----------|---------------|
| `feature_actions.action` | `'create'`, `'read'`, `'update'`, `'delete'` |
| `user_profiles.theme_preference` | `'light'`, `'dark'`, `'system'` |
| `restaurants.review_auto_reply_mode` | `'template'`, `'ai'` |
| `restaurants.ticket_auto_reply_mode` | `'template'`, `'ai'` |
| `reviews.response_mode` | `'manual'`, `'template'`, `'ai'` |
| `reviews.response_status` | `'pending'`, `'sent'`, `'failed'` |
| `tickets.status` | `'open'`, `'in_progress'`, `'resolved'`, `'closed'` |
| `ticket_messages.sender` | `'customer'`, `'restaurant'`, `'system'` |
| `ticket_messages.response_mode` | `'manual'`, `'template'`, `'ai'` |
| `ticket_messages.response_status` | `'pending'`, `'sent'`, `'failed'` |
| `financial_entries.entry_type` | `'revenue'`, `'fee'`, `'promotion'`, `'refund'`, `'adjustment'`, `'delivery_fee'`, `'commission'`, `'other'` |
| `reports.status` | `'generated'`, `'sending'`, `'sent'`, `'failed'` |
| `report_send_logs.channel` | `'email'`, `'whatsapp'` |
| `report_send_logs.status` | `'pending'`, `'sent'`, `'failed'` |
| `actions.action_type` | `'menu_adjustment'`, `'promotion'`, `'response'`, `'operational'`, `'marketing'`, `'other'` |
| `actions.status` | `'planned'`, `'done'`, `'discarded'` |
| `image_jobs.mode` | `'improve_existing'`, `'from_image'`, `'from_description'`, `'from_new_description'`, `'direct_upload'` |
| `image_jobs.status` | `'generating'`, `'ready_for_approval'`, `'approved'`, `'applied_to_catalog'`, `'rejected'`, `'archived'`, `'failed'` |
| `admin_notifications.channel` | `'email'`, `'whatsapp'` |
| `admin_notifications.status` | `'pending'`, `'sent'`, `'failed'` |
| `data_collection_logs.status` | `'success'`, `'failed'` |
| `reviews.rating` | `1` through `5` (integer range CHECK) |

---

## Storage Buckets

### reports

- **Access:** Private
- **Purpose:** Store generated PDF reports for weekly BI delivery. Referenced by `reports.pdf_url`.

### evidences

- **Access:** Private
- **Purpose:** Store action evidence files (images, documents). Referenced by `actions.done_evidence`.

---

## Seed Data

The following seed data is inserted by migration `20260217200002_rbac.sql`:

### Default Admin Role

```
roles: { name: 'admin', description: 'System administrator with full access', is_system: true }
```

### Feature Groups

Seven feature groups are created:

| Group Name |
|-----------|
| users |
| restaurants |
| reports |
| reviews |
| tickets |
| financial |
| catalog |

### Features

One feature per group is created with the same `code` as the group `name`:

| Feature Code | Feature Group |
|-------------|--------------|
| users | users |
| restaurants | restaurants |
| reports | reports |
| reviews | reviews |
| tickets | tickets |
| financial | financial |
| catalog | catalog |

### Feature Actions

All four CRUD actions are created for each feature:

- `create`, `read`, `update`, `delete` for each of the 7 features = 28 feature_actions total.

### Admin Role Permissions

The admin role is granted ALL 28 feature_actions, giving it full CRUD access to every feature.

---

## Entity Relationship Summary

The database follows a hierarchical multi-tenant model centered around iFood accounts and restaurants:

1. **Auth and Profiles**: `auth.users` (Supabase Auth) -> `user_profiles` (1:1, auto-created via trigger).

2. **RBAC**: `user_roles` links `auth.users` to `roles`. `role_permissions` links `roles` to `feature_actions`. `feature_actions` links `features` to CRUD actions. `features` belong to `feature_groups`.

3. **Multi-tenant Access**: `ifood_account_access` is the pivotal junction table linking `auth.users` to `ifood_accounts`. A user can access multiple iFood accounts, and each account can be shared with multiple users.

4. **Restaurant Hierarchy**: `ifood_accounts` -> `restaurants` (1:N). Each iFood merchant account can have multiple restaurants. Restaurant access is inherited from the iFood account access.

5. **Restaurant Data Entities**: Each restaurant owns:
   - `restaurant_snapshots` -- weekly performance metrics
   - `orders` -- synced iFood orders
   - `reviews` -- customer reviews with response tracking
   - `tickets` -> `ticket_messages` -- support tickets and their messages
   - `financial_entries` -- financial transactions
   - `catalog_categories` -> `catalog_items` -- menu catalog
   - `data_collection_logs` -- sync job logs

6. **Reports and Actions**: `reports` are weekly BI reports per restaurant, linked to:
   - `report_send_logs` -- delivery tracking
   - `report_internal_content` -- internal analyst notes
   - `actions` -- recommended actions derived from reports
   - `checklists` -- weekly task items

7. **Image Generation**: `image_jobs` are AI image generation tasks linked to `catalog_items` and `restaurants`, with `image_job_logs` for action tracking.

8. **Admin Tools**: `admin_notifications` for sending messages to users, `invitations` for user onboarding.

9. **Infrastructure**: `idempotency_keys` for deduplication, `audit_logs` for change tracking, `rate_limit_logs` for API throttling.

---

## RBAC System Deep Dive

The RBAC (Role-Based Access Control) system controls what users can do across the application. It is built on three helper functions that are used extensively in RLS policies throughout the database.

### How `user_can()` Works

```
user_can(user_id, feature_code, action) -> BOOLEAN
```

1. First checks if the user has the system admin role (`roles.name = 'admin'` AND `roles.is_system = true`). If yes, returns `true` immediately -- admins can do everything.
2. Otherwise, traverses the permission chain: `user_roles` -> `role_permissions` -> `feature_actions` -> `features` to check if any of the user's roles grant the specific `(feature_code, action)` combination.
3. Used in RLS policies for admin-level operations (e.g., creating restaurants, managing users, inserting data collection records).

### How `get_user_permissions()` Works

```
get_user_permissions(user_id) -> TABLE(feature_code, action)
```

1. If the user is a system admin, returns ALL feature_code/action combinations from the `features` and `feature_actions` tables.
2. Otherwise, returns only the distinct `(feature_code, action)` pairs granted through the user's role assignments.
3. Useful for the frontend to load the full permission set once and cache it for UI rendering decisions.

### How `user_has_restaurant_access()` Works

```
user_has_restaurant_access(user_id, restaurant_id) -> BOOLEAN
```

1. If the user is a system admin, returns `true` -- admins can access all restaurants.
2. Otherwise, follows the access chain: `restaurants` -> `ifood_accounts` -> `ifood_account_access` to check if the user has been granted access to the iFood account that owns the target restaurant.
3. Used in RLS policies for all restaurant-scoped data (orders, reviews, tickets, financial entries, catalog, reports, actions, checklists, image jobs, etc.).

### Access Model Summary

There are two layers of authorization:

- **Feature-level (RBAC)**: "Can this user perform CRUD operations on this feature?" -- Controlled by `user_can()`. Used for admin operations like creating restaurants, managing users, or inserting synced data.
- **Data-level (Restaurant Access)**: "Can this user see/modify data for this restaurant?" -- Controlled by `user_has_restaurant_access()`. Used for all restaurant-scoped read/write operations.

System admins bypass both checks. Regular users need both appropriate role permissions AND restaurant access to work with restaurant data.

---

## Migration Files Reference

| Order | File | Purpose |
|-------|------|---------|
| 1 | `20260217200001_infrastructure.sql` | `idempotency_keys`, `audit_logs`, `rate_limit_logs`, `update_updated_at()`, `log_audit()`, `audit_trigger()` |
| 2 | `20260217200002_rbac.sql` | `roles`, `feature_groups`, `features`, `feature_actions`, `role_permissions`, `user_roles`, `user_can()`, `get_user_permissions()`, seed data |
| 3 | `20260217200003_users.sql` | `user_profiles`, `handle_new_user()`, `on_auth_user_created` trigger |
| 4 | `20260217200004_invitations.sql` | `invitations` with audit trigger |
| 5 | `20260217200005_ifood_accounts.sql` | `ifood_accounts`, `ifood_account_access` |
| 6 | `20260217200006_restaurants.sql` | `restaurants`, `user_has_restaurant_access()` |
| 7 | `20260217200007_ifood_entities.sql` | `restaurant_snapshots`, `orders`, `reviews`, `tickets`, `ticket_messages`, `financial_entries`, `catalog_categories`, `catalog_items`, `data_collection_logs` |
| 8 | `20260217200008_reports_actions.sql` | `reports`, `report_send_logs`, `report_internal_content`, `actions`, `checklists` |
| 9 | `20260217200009_image_jobs.sql` | `image_jobs`, `image_job_logs` |
| 10 | `20260217200010_admin.sql` | `admin_notifications` |
