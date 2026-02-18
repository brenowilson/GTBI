-- =============================================================================
-- GTBI Seed Data — Realistic mock data for development/review
-- Run via: supabase db reset (auto-applies after migrations)
-- =============================================================================

-- Fixed UUIDs for deterministic references
-- Users
DO $$ BEGIN
  -- Admin user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'a0000000-0000-0000-0000-000000000001') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
    VALUES (
      'a0000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'admin@gtbi.dev',
      crypt('Admin123!', gen_salt('bf')),
      now(),
      '{"full_name": "Carlos Admin"}'::jsonb,
      now(), now(), 'authenticated', 'authenticated'
    );
  END IF;

  -- Manager user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'a0000000-0000-0000-0000-000000000002') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
    VALUES (
      'a0000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000000',
      'gerente@gtbi.dev',
      crypt('Gerente123!', gen_salt('bf')),
      now(),
      '{"full_name": "Maria Gerente"}'::jsonb,
      now(), now(), 'authenticated', 'authenticated'
    );
  END IF;

  -- Analyst user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'a0000000-0000-0000-0000-000000000003') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
    VALUES (
      'a0000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000000',
      'analista@gtbi.dev',
      crypt('Analista123!', gen_salt('bf')),
      now(),
      '{"full_name": "João Analista"}'::jsonb,
      now(), now(), 'authenticated', 'authenticated'
    );
  END IF;

  -- Viewer user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'a0000000-0000-0000-0000-000000000004') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
    VALUES (
      'a0000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000000',
      'viewer@gtbi.dev',
      crypt('Viewer123!', gen_salt('bf')),
      now(),
      '{"full_name": "Ana Visualizadora"}'::jsonb,
      now(), now(), 'authenticated', 'authenticated'
    );
  END IF;
END $$;

-- =============================================================================
-- ROLES (admin already seeded by migration)
-- =============================================================================

INSERT INTO public.roles (id, name, description, is_system)
VALUES
  ('b0000000-0000-0000-0000-000000000002', 'gerente', 'Gerente com acesso a todas as funcionalidades operacionais', false),
  ('b0000000-0000-0000-0000-000000000003', 'analista', 'Analista com acesso de leitura e relatórios', false),
  ('b0000000-0000-0000-0000-000000000004', 'viewer', 'Visualizador com acesso somente leitura', false)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- ROLE PERMISSIONS
-- =============================================================================

-- Gerente: all CRUD on restaurants, reports, reviews, tickets, financial, catalog
INSERT INTO public.role_permissions (role_id, feature_action_id)
SELECT 'b0000000-0000-0000-0000-000000000002', fa.id
FROM public.feature_actions fa
JOIN public.features f ON fa.feature_id = f.id
WHERE f.code IN ('restaurants', 'reports', 'reviews', 'tickets', 'financial', 'catalog')
ON CONFLICT (role_id, feature_action_id) DO NOTHING;

-- Gerente: read users only
INSERT INTO public.role_permissions (role_id, feature_action_id)
SELECT 'b0000000-0000-0000-0000-000000000002', fa.id
FROM public.feature_actions fa
JOIN public.features f ON fa.feature_id = f.id
WHERE f.code = 'users' AND fa.action = 'read'
ON CONFLICT (role_id, feature_action_id) DO NOTHING;

-- Analista: read on all features + update on reports/reviews
INSERT INTO public.role_permissions (role_id, feature_action_id)
SELECT 'b0000000-0000-0000-0000-000000000003', fa.id
FROM public.feature_actions fa
JOIN public.features f ON fa.feature_id = f.id
WHERE fa.action = 'read'
ON CONFLICT (role_id, feature_action_id) DO NOTHING;

INSERT INTO public.role_permissions (role_id, feature_action_id)
SELECT 'b0000000-0000-0000-0000-000000000003', fa.id
FROM public.feature_actions fa
JOIN public.features f ON fa.feature_id = f.id
WHERE f.code IN ('reports', 'reviews') AND fa.action = 'update'
ON CONFLICT (role_id, feature_action_id) DO NOTHING;

-- Viewer: read only on restaurants, reports, reviews, financial
INSERT INTO public.role_permissions (role_id, feature_action_id)
SELECT 'b0000000-0000-0000-0000-000000000004', fa.id
FROM public.feature_actions fa
JOIN public.features f ON fa.feature_id = f.id
WHERE f.code IN ('restaurants', 'reports', 'reviews', 'financial') AND fa.action = 'read'
ON CONFLICT (role_id, feature_action_id) DO NOTHING;

-- =============================================================================
-- USER ROLES
-- =============================================================================

-- Assign admin role
INSERT INTO public.user_roles (user_id, role_id, assigned_by)
SELECT
  'a0000000-0000-0000-0000-000000000001',
  r.id,
  'a0000000-0000-0000-0000-000000000001'
FROM public.roles r WHERE r.name = 'admin' AND r.is_system = true
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign gerente role
INSERT INTO public.user_roles (user_id, role_id, assigned_by)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001'
) ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign analista role
INSERT INTO public.user_roles (user_id, role_id, assigned_by)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001'
) ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign viewer role
INSERT INTO public.user_roles (user_id, role_id, assigned_by)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001'
) ON CONFLICT (user_id, role_id) DO NOTHING;

-- =============================================================================
-- IFOOD ACCOUNTS
-- =============================================================================

INSERT INTO public.ifood_accounts (id, name, merchant_id, is_active, access_token, refresh_token, token_expires_at, last_sync_at, created_by)
VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'Grupo Sabor & Arte',
    'MOCK-MERCHANT-001',
    true,
    'mock-access-token-001',
    'mock-refresh-token-001',
    now() + interval '1 hour',
    now() - interval '2 hours',
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'Rede Bom Prato',
    'MOCK-MERCHANT-002',
    true,
    'mock-access-token-002',
    'mock-refresh-token-002',
    now() + interval '30 minutes',
    now() - interval '6 hours',
    'a0000000-0000-0000-0000-000000000001'
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- IFOOD ACCOUNT ACCESS
-- =============================================================================

INSERT INTO public.ifood_account_access (ifood_account_id, user_id, granted_by) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (ifood_account_id, user_id) DO NOTHING;

-- =============================================================================
-- RESTAURANTS
-- =============================================================================

INSERT INTO public.restaurants (id, ifood_account_id, ifood_restaurant_id, name, address, is_active, review_auto_reply_enabled, review_auto_reply_mode, review_reply_template, ticket_auto_reply_enabled, ticket_auto_reply_mode, ticket_reply_template)
VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'IFOOD-REST-001',
    'Sabor & Arte — Centro',
    'Rua Augusta, 1200 — Centro, São Paulo/SP',
    true,
    true, 'ai', NULL,
    false, 'template', 'Olá! Recebemos sua mensagem e estamos analisando. Retornaremos em breve.'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'IFOOD-REST-002',
    'Sabor & Arte — Jardins',
    'Av. Paulista, 900 — Jardins, São Paulo/SP',
    true,
    true, 'template', 'Obrigado pela sua avaliação! Sua opinião é muito importante para nós.',
    false, 'template', NULL
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'IFOOD-REST-003',
    'Bom Prato — Moema',
    'Alameda dos Nhambiquaras, 450 — Moema, São Paulo/SP',
    true,
    false, 'template', NULL,
    false, 'template', NULL
  )
ON CONFLICT (ifood_account_id, ifood_restaurant_id) DO NOTHING;

-- =============================================================================
-- RESTAURANT SNAPSHOTS (4 weeks of performance data)
-- =============================================================================

INSERT INTO public.restaurant_snapshots (restaurant_id, week_start, week_end, visits, views, to_cart, checkout, completed, cancellation_rate, open_time_rate, open_tickets_rate, new_customers_rate)
VALUES
  -- Sabor & Arte Centro — steady growth
  ('d0000000-0000-0000-0000-000000000001', '2026-01-26', '2026-02-01', 1200, 980, 520, 310, 285, 0.0380, 0.8500, 0.0200, 0.1500),
  ('d0000000-0000-0000-0000-000000000001', '2026-02-02', '2026-02-08', 1350, 1100, 600, 370, 340, 0.0350, 0.8800, 0.0150, 0.1600),
  ('d0000000-0000-0000-0000-000000000001', '2026-02-09', '2026-02-15', 1500, 1250, 680, 420, 390, 0.0300, 0.9100, 0.0100, 0.1800),
  ('d0000000-0000-0000-0000-000000000001', '2026-02-16', '2026-02-22', 1480, 1200, 650, 400, 370, 0.0320, 0.9000, 0.0120, 0.1700),

  -- Sabor & Arte Jardins — declining (needs attention)
  ('d0000000-0000-0000-0000-000000000002', '2026-01-26', '2026-02-01', 900, 750, 380, 220, 195, 0.0420, 0.7800, 0.0350, 0.1200),
  ('d0000000-0000-0000-0000-000000000002', '2026-02-02', '2026-02-08', 850, 700, 340, 200, 175, 0.0500, 0.7500, 0.0400, 0.1100),
  ('d0000000-0000-0000-0000-000000000002', '2026-02-09', '2026-02-15', 780, 620, 290, 170, 148, 0.0550, 0.7200, 0.0450, 0.0900),
  ('d0000000-0000-0000-0000-000000000002', '2026-02-16', '2026-02-22', 720, 580, 260, 150, 128, 0.0600, 0.7000, 0.0500, 0.0800),

  -- Bom Prato Moema — stable
  ('d0000000-0000-0000-0000-000000000003', '2026-01-26', '2026-02-01', 600, 500, 260, 160, 148, 0.0300, 0.8200, 0.0180, 0.1400),
  ('d0000000-0000-0000-0000-000000000003', '2026-02-02', '2026-02-08', 620, 510, 270, 165, 152, 0.0280, 0.8300, 0.0160, 0.1350),
  ('d0000000-0000-0000-0000-000000000003', '2026-02-09', '2026-02-15', 610, 505, 265, 162, 150, 0.0290, 0.8250, 0.0170, 0.1380),
  ('d0000000-0000-0000-0000-000000000003', '2026-02-16', '2026-02-22', 630, 520, 275, 170, 157, 0.0270, 0.8400, 0.0150, 0.1420)
ON CONFLICT (restaurant_id, week_start) DO NOTHING;

-- =============================================================================
-- ORDERS (recent 2 weeks, ~10 per restaurant)
-- =============================================================================

INSERT INTO public.orders (restaurant_id, ifood_order_id, status, total, items_count, customer_name, order_date)
VALUES
  -- Centro
  ('d0000000-0000-0000-0000-000000000001', 'ORD-C001', 'completed', 89.90, 3, 'Fernanda Silva', now() - interval '1 day'),
  ('d0000000-0000-0000-0000-000000000001', 'ORD-C002', 'completed', 45.50, 2, 'Roberto Costa', now() - interval '1 day 3 hours'),
  ('d0000000-0000-0000-0000-000000000001', 'ORD-C003', 'completed', 122.00, 5, 'Amanda Oliveira', now() - interval '2 days'),
  ('d0000000-0000-0000-0000-000000000001', 'ORD-C004', 'cancelled', 67.80, 2, 'Pedro Santos', now() - interval '2 days 5 hours'),
  ('d0000000-0000-0000-0000-000000000001', 'ORD-C005', 'completed', 34.90, 1, 'Lucas Pereira', now() - interval '3 days'),
  ('d0000000-0000-0000-0000-000000000001', 'ORD-C006', 'completed', 156.40, 6, 'Mariana Souza', now() - interval '4 days'),
  ('d0000000-0000-0000-0000-000000000001', 'ORD-C007', 'completed', 78.00, 3, 'Thiago Lima', now() - interval '5 days'),
  ('d0000000-0000-0000-0000-000000000001', 'ORD-C008', 'completed', 52.30, 2, 'Juliana Alves', now() - interval '6 days'),
  ('d0000000-0000-0000-0000-000000000001', 'ORD-C009', 'completed', 98.70, 4, 'Bruno Ferreira', now() - interval '7 days'),
  ('d0000000-0000-0000-0000-000000000001', 'ORD-C010', 'completed', 41.50, 2, 'Camila Rocha', now() - interval '8 days'),

  -- Jardins
  ('d0000000-0000-0000-0000-000000000002', 'ORD-J001', 'completed', 65.90, 2, 'Ricardo Mendes', now() - interval '1 day 2 hours'),
  ('d0000000-0000-0000-0000-000000000002', 'ORD-J002', 'cancelled', 38.50, 1, 'Patricia Dias', now() - interval '2 days'),
  ('d0000000-0000-0000-0000-000000000002', 'ORD-J003', 'completed', 142.00, 5, 'Gustavo Ribeiro', now() - interval '2 days 4 hours'),
  ('d0000000-0000-0000-0000-000000000002', 'ORD-J004', 'cancelled', 55.00, 2, 'Isabela Castro', now() - interval '3 days'),
  ('d0000000-0000-0000-0000-000000000002', 'ORD-J005', 'completed', 79.90, 3, 'Felipe Martins', now() - interval '4 days'),
  ('d0000000-0000-0000-0000-000000000002', 'ORD-J006', 'completed', 28.50, 1, 'Letícia Araújo', now() - interval '5 days'),
  ('d0000000-0000-0000-0000-000000000002', 'ORD-J007', 'completed', 110.20, 4, 'Diego Nascimento', now() - interval '6 days'),
  ('d0000000-0000-0000-0000-000000000002', 'ORD-J008', 'cancelled', 45.80, 2, 'Natalia Barbosa', now() - interval '7 days'),

  -- Moema
  ('d0000000-0000-0000-0000-000000000003', 'ORD-M001', 'completed', 72.40, 3, 'Vinícius Gomes', now() - interval '1 day'),
  ('d0000000-0000-0000-0000-000000000003', 'ORD-M002', 'completed', 55.00, 2, 'Aline Teixeira', now() - interval '1 day 6 hours'),
  ('d0000000-0000-0000-0000-000000000003', 'ORD-M003', 'completed', 98.30, 4, 'Marcelo Freitas', now() - interval '2 days'),
  ('d0000000-0000-0000-0000-000000000003', 'ORD-M004', 'completed', 33.90, 1, 'Daniela Cardoso', now() - interval '3 days'),
  ('d0000000-0000-0000-0000-000000000003', 'ORD-M005', 'cancelled', 61.50, 2, 'Rodrigo Nunes', now() - interval '4 days'),
  ('d0000000-0000-0000-0000-000000000003', 'ORD-M006', 'completed', 87.20, 3, 'Tatiana Moreira', now() - interval '5 days'),
  ('d0000000-0000-0000-0000-000000000003', 'ORD-M007', 'completed', 44.50, 2, 'André Carvalho', now() - interval '6 days'),
  ('d0000000-0000-0000-0000-000000000003', 'ORD-M008', 'completed', 119.80, 5, 'Priscila Santos', now() - interval '7 days')
ON CONFLICT (ifood_order_id) DO NOTHING;

-- =============================================================================
-- REVIEWS (realistic PT-BR comments, varied ratings)
-- =============================================================================

INSERT INTO public.reviews (restaurant_id, ifood_review_id, order_id, rating, comment, customer_name, review_date, response, response_sent_at, response_mode, response_status)
VALUES
  -- Centro — mostly positive
  ('d0000000-0000-0000-0000-000000000001', 'REV-C001', 'ORD-C001', 5, 'Comida maravilhosa! O filé chegou perfeito, no ponto. Entrega super rápida. Parabéns!', 'Fernanda Silva', now() - interval '1 day', 'Obrigado Fernanda! Ficamos felizes que tenha gostado. Volte sempre!', now() - interval '20 hours', 'ai', 'sent'),
  ('d0000000-0000-0000-0000-000000000001', 'REV-C002', 'ORD-C002', 4, 'Boa comida, mas demorou um pouco mais do que o esperado. Sabor ótimo porém.', 'Roberto Costa', now() - interval '1 day 3 hours', 'Agradecemos o feedback Roberto! Vamos trabalhar para melhorar o tempo de entrega.', now() - interval '22 hours', 'ai', 'sent'),
  ('d0000000-0000-0000-0000-000000000001', 'REV-C003', 'ORD-C003', 5, 'Pedi pra família toda e todo mundo adorou! Porções generosas e muito saborosas.', 'Amanda Oliveira', now() - interval '2 days', NULL, NULL, NULL, 'pending'),
  ('d0000000-0000-0000-0000-000000000001', 'REV-C004', 'ORD-C004', 2, 'Pedido veio errado. Pedi sem cebola e veio com cebola. Decepcionante.', 'Pedro Santos', now() - interval '2 days 5 hours', NULL, NULL, NULL, 'pending'),
  ('d0000000-0000-0000-0000-000000000001', 'REV-C005', 'ORD-C005', 4, 'Hambúrguer muito bom! Pão fresquinho e carne suculenta.', 'Lucas Pereira', now() - interval '3 days', 'Obrigado Lucas! Nossos hambúrgueres são feitos com muito carinho.', now() - interval '2 days 20 hours', 'template', 'sent'),
  ('d0000000-0000-0000-0000-000000000001', 'REV-C006', 'ORD-C006', 5, 'Melhor restaurante do bairro no iFood! Já é a terceira vez que peço essa semana.', 'Mariana Souza', now() - interval '4 days', NULL, NULL, NULL, 'pending'),
  ('d0000000-0000-0000-0000-000000000001', 'REV-C007', 'ORD-C007', 3, 'Comida boa mas embalagem poderia ser melhor. A salada chegou toda misturada.', 'Thiago Lima', now() - interval '5 days', 'Obrigado pelo feedback Thiago! Vamos melhorar nossas embalagens.', now() - interval '4 days 18 hours', 'ai', 'sent'),
  ('d0000000-0000-0000-0000-000000000001', 'REV-C008', 'ORD-C009', 5, 'Tudo perfeito como sempre. Comida fresca, entrega no prazo, embalagem impecável!', 'Bruno Ferreira', now() - interval '7 days', NULL, NULL, NULL, 'pending'),

  -- Jardins — more mixed (declining restaurant)
  ('d0000000-0000-0000-0000-000000000002', 'REV-J001', 'ORD-J001', 3, 'Achei que poderia ser melhor pelo preço. Porção pequena para o que foi cobrado.', 'Ricardo Mendes', now() - interval '1 day 2 hours', NULL, NULL, NULL, 'pending'),
  ('d0000000-0000-0000-0000-000000000002', 'REV-J002', 'ORD-J003', 4, 'Comida muito boa! Pena que demorou quase 1 hora pra chegar.', 'Gustavo Ribeiro', now() - interval '2 days 4 hours', 'Obrigado pela sua avaliação! Sua opinião é muito importante para nós.', now() - interval '2 days', 'template', 'sent'),
  ('d0000000-0000-0000-0000-000000000002', 'REV-J003', 'ORD-J004', 1, 'Pedido cancelado pelo restaurante sem explicação. Péssimo atendimento!', 'Isabela Castro', now() - interval '3 days', NULL, NULL, NULL, 'pending'),
  ('d0000000-0000-0000-0000-000000000002', 'REV-J004', 'ORD-J005', 3, 'Na média. Nada excepcional mas também nada ruim. Comida chegou morna.', 'Felipe Martins', now() - interval '4 days', NULL, NULL, NULL, 'pending'),
  ('d0000000-0000-0000-0000-000000000002', 'REV-J005', 'ORD-J006', 2, 'Faltou item no pedido. Pedi refrigerante e não veio. Já é a segunda vez.', 'Letícia Araújo', now() - interval '5 days', 'Obrigado pela sua avaliação! Sua opinião é muito importante para nós.', now() - interval '4 days 20 hours', 'template', 'sent'),
  ('d0000000-0000-0000-0000-000000000002', 'REV-J006', 'ORD-J007', 4, 'Gostei bastante do prato executivo. Bom custo-benefício para o almoço.', 'Diego Nascimento', now() - interval '6 days', NULL, NULL, NULL, 'pending'),

  -- Moema — mostly positive
  ('d0000000-0000-0000-0000-000000000003', 'REV-M001', 'ORD-M001', 5, 'Excelente! Pizza artesanal de verdade. Massa fina e crocante, molho caseiro. Top!', 'Vinícius Gomes', now() - interval '1 day', NULL, NULL, NULL, 'pending'),
  ('d0000000-0000-0000-0000-000000000003', 'REV-M002', 'ORD-M002', 4, 'Muito bom! Só achei que a pizza poderia ter vindo um pouco mais quente.', 'Aline Teixeira', now() - interval '1 day 6 hours', NULL, NULL, NULL, 'pending'),
  ('d0000000-0000-0000-0000-000000000003', 'REV-M003', 'ORD-M003', 5, 'Virei cliente fiel! Melhor pizza da região. Ingredientes frescos e de qualidade.', 'Marcelo Freitas', now() - interval '2 days', NULL, NULL, NULL, 'pending'),
  ('d0000000-0000-0000-0000-000000000003', 'REV-M004', 'ORD-M004', 3, 'Boa mas já foi melhor. Senti que a qualidade caiu um pouco nas últimas vezes.', 'Daniela Cardoso', now() - interval '3 days', NULL, NULL, NULL, 'pending'),
  ('d0000000-0000-0000-0000-000000000003', 'REV-M005', 'ORD-M006', 5, 'Sensacional! O combo família é incrível. Pizza + sobremesa + refrigerante. Perfeito!', 'Tatiana Moreira', now() - interval '5 days', NULL, NULL, NULL, 'pending'),
  ('d0000000-0000-0000-0000-000000000003', 'REV-M006', 'ORD-M008', 4, 'Muito saboroso. Entrega rápida e embalagem que mantém a pizza quentinha.', 'Priscila Santos', now() - interval '7 days', NULL, NULL, NULL, 'pending')
ON CONFLICT (ifood_review_id) DO NOTHING;

-- =============================================================================
-- TICKETS
-- =============================================================================

INSERT INTO public.tickets (id, restaurant_id, ifood_ticket_id, order_id, subject, status)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'TKT-C001', 'ORD-C004', 'Pedido com item errado — cliente alérgico', 'open'),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'TKT-C002', 'ORD-C006', 'Solicitação de nota fiscal', 'resolved'),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'TKT-J001', 'ORD-J002', 'Cancelamento indevido — cliente quer reembolso', 'open'),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'TKT-J002', 'ORD-J004', 'Item faltando no pedido', 'in_progress'),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'TKT-J003', 'ORD-J008', 'Atraso na entrega — mais de 1h', 'open'),
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 'TKT-M001', 'ORD-M005', 'Pedido cancelado — problema no preparo', 'resolved')
ON CONFLICT (ifood_ticket_id) DO NOTHING;

-- =============================================================================
-- TICKET MESSAGES
-- =============================================================================

INSERT INTO public.ticket_messages (ticket_id, sender, content, response_mode, response_status, sent_at)
VALUES
  -- TKT-C001
  ('e0000000-0000-0000-0000-000000000001', 'customer', 'Pedi sem cebola pois tenho alergia e o prato veio com cebola. Isso é muito grave!', NULL, NULL, now() - interval '2 days 5 hours'),
  ('e0000000-0000-0000-0000-000000000001', 'restaurant', 'Pedimos sinceras desculpas. Vamos tomar medidas para que isso não se repita. Gostaríamos de oferecer um crédito.', 'manual', 'sent', now() - interval '2 days 3 hours'),
  ('e0000000-0000-0000-0000-000000000001', 'customer', 'Agradeço a resposta, mas preciso que isso seja resolvido com mais seriedade. Poderia ter sido perigoso.', NULL, NULL, now() - interval '2 days 1 hour'),

  -- TKT-C002 (resolved)
  ('e0000000-0000-0000-0000-000000000002', 'customer', 'Preciso da nota fiscal do pedido para fins de reembolso corporativo.', NULL, NULL, now() - interval '4 days'),
  ('e0000000-0000-0000-0000-000000000002', 'restaurant', 'Nota fiscal enviada para o e-mail cadastrado. Qualquer dúvida estamos à disposição!', 'manual', 'sent', now() - interval '3 days 22 hours'),

  -- TKT-J001
  ('e0000000-0000-0000-0000-000000000003', 'customer', 'Meu pedido foi cancelado sem motivo. Quero reembolso imediato.', NULL, NULL, now() - interval '2 days'),
  ('e0000000-0000-0000-0000-000000000003', 'restaurant', 'Verificamos que houve um erro no sistema. O reembolso está sendo processado.', 'template', 'sent', now() - interval '1 day 20 hours'),

  -- TKT-J002
  ('e0000000-0000-0000-0000-000000000004', 'customer', 'Faltou o refrigerante no meu pedido. É a segunda vez que isso acontece.', NULL, NULL, now() - interval '3 days'),

  -- TKT-J003
  ('e0000000-0000-0000-0000-000000000005', 'customer', 'O pedido demorou mais de 1 hora para chegar. Comida chegou fria.', NULL, NULL, now() - interval '7 days'),

  -- TKT-M001 (resolved)
  ('e0000000-0000-0000-0000-000000000006', 'customer', 'Vocês cancelaram meu pedido. O que aconteceu?', NULL, NULL, now() - interval '4 days'),
  ('e0000000-0000-0000-0000-000000000006', 'restaurant', 'Pedimos desculpas! Tivemos um problema no preparo e preferimos cancelar a enviar o pedido com qualidade abaixo. Reembolso processado.', 'manual', 'sent', now() - interval '3 days 22 hours'),
  ('e0000000-0000-0000-0000-000000000006', 'customer', 'Entendo, obrigado pela transparência. Vou pedir novamente.', NULL, NULL, now() - interval '3 days 20 hours');

-- =============================================================================
-- FINANCIAL ENTRIES (last 4 weeks)
-- =============================================================================

INSERT INTO public.financial_entries (restaurant_id, ifood_entry_id, entry_type, description, amount, reference_date, order_id)
VALUES
  -- Centro — Week 1
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C001', 'revenue', 'Vendas — Semana 1', 8520.50, '2026-01-26', NULL),
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C002', 'commission', 'Comissão iFood — Semana 1', -1278.08, '2026-01-26', NULL),
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C003', 'delivery_fee', 'Taxa de entrega — Semana 1', -425.50, '2026-01-26', NULL),
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C004', 'promotion', 'Promoção Cupom 10% — Semana 1', -340.80, '2026-01-26', NULL),
  -- Centro — Week 2
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C005', 'revenue', 'Vendas — Semana 2', 9850.00, '2026-02-02', NULL),
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C006', 'commission', 'Comissão iFood — Semana 2', -1477.50, '2026-02-02', NULL),
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C007', 'delivery_fee', 'Taxa de entrega — Semana 2', -492.50, '2026-02-02', NULL),
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C008', 'refund', 'Reembolso pedido ORD-C004', -67.80, '2026-02-04', 'ORD-C004'),
  -- Centro — Week 3
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C009', 'revenue', 'Vendas — Semana 3', 11200.30, '2026-02-09', NULL),
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C010', 'commission', 'Comissão iFood — Semana 3', -1680.05, '2026-02-09', NULL),
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C011', 'delivery_fee', 'Taxa de entrega — Semana 3', -560.02, '2026-02-09', NULL),
  -- Centro — Week 4
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C012', 'revenue', 'Vendas — Semana 4', 10800.00, '2026-02-16', NULL),
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C013', 'commission', 'Comissão iFood — Semana 4', -1620.00, '2026-02-16', NULL),
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C014', 'delivery_fee', 'Taxa de entrega — Semana 4', -540.00, '2026-02-16', NULL),
  ('d0000000-0000-0000-0000-000000000001', 'FIN-C015', 'promotion', 'Promoção Carnaval — Semana 4', -648.00, '2026-02-16', NULL),

  -- Jardins — Week 1-4 (declining revenue)
  ('d0000000-0000-0000-0000-000000000002', 'FIN-J001', 'revenue', 'Vendas — Semana 1', 5800.00, '2026-01-26', NULL),
  ('d0000000-0000-0000-0000-000000000002', 'FIN-J002', 'commission', 'Comissão iFood — Semana 1', -870.00, '2026-01-26', NULL),
  ('d0000000-0000-0000-0000-000000000002', 'FIN-J003', 'delivery_fee', 'Taxa de entrega — Semana 1', -290.00, '2026-01-26', NULL),
  ('d0000000-0000-0000-0000-000000000002', 'FIN-J004', 'revenue', 'Vendas — Semana 2', 5200.00, '2026-02-02', NULL),
  ('d0000000-0000-0000-0000-000000000002', 'FIN-J005', 'commission', 'Comissão iFood — Semana 2', -780.00, '2026-02-02', NULL),
  ('d0000000-0000-0000-0000-000000000002', 'FIN-J006', 'refund', 'Reembolso pedido ORD-J002', -38.50, '2026-02-03', 'ORD-J002'),
  ('d0000000-0000-0000-0000-000000000002', 'FIN-J007', 'refund', 'Reembolso pedido ORD-J004', -55.00, '2026-02-05', 'ORD-J004'),
  ('d0000000-0000-0000-0000-000000000002', 'FIN-J008', 'revenue', 'Vendas — Semana 3', 4500.00, '2026-02-09', NULL),
  ('d0000000-0000-0000-0000-000000000002', 'FIN-J009', 'commission', 'Comissão iFood — Semana 3', -675.00, '2026-02-09', NULL),
  ('d0000000-0000-0000-0000-000000000002', 'FIN-J010', 'revenue', 'Vendas — Semana 4', 3800.00, '2026-02-16', NULL),
  ('d0000000-0000-0000-0000-000000000002', 'FIN-J011', 'commission', 'Comissão iFood — Semana 4', -570.00, '2026-02-16', NULL),
  ('d0000000-0000-0000-0000-000000000002', 'FIN-J012', 'refund', 'Reembolso pedido ORD-J008', -45.80, '2026-02-14', 'ORD-J008'),

  -- Moema — stable
  ('d0000000-0000-0000-0000-000000000003', 'FIN-M001', 'revenue', 'Vendas — Semana 1', 4200.00, '2026-01-26', NULL),
  ('d0000000-0000-0000-0000-000000000003', 'FIN-M002', 'commission', 'Comissão iFood — Semana 1', -630.00, '2026-01-26', NULL),
  ('d0000000-0000-0000-0000-000000000003', 'FIN-M003', 'delivery_fee', 'Taxa de entrega — Semana 1', -210.00, '2026-01-26', NULL),
  ('d0000000-0000-0000-0000-000000000003', 'FIN-M004', 'revenue', 'Vendas — Semana 2', 4350.00, '2026-02-02', NULL),
  ('d0000000-0000-0000-0000-000000000003', 'FIN-M005', 'commission', 'Comissão iFood — Semana 2', -652.50, '2026-02-02', NULL),
  ('d0000000-0000-0000-0000-000000000003', 'FIN-M006', 'revenue', 'Vendas — Semana 3', 4280.00, '2026-02-09', NULL),
  ('d0000000-0000-0000-0000-000000000003', 'FIN-M007', 'commission', 'Comissão iFood — Semana 3', -642.00, '2026-02-09', NULL),
  ('d0000000-0000-0000-0000-000000000003', 'FIN-M008', 'refund', 'Reembolso pedido ORD-M005', -61.50, '2026-02-07', 'ORD-M005'),
  ('d0000000-0000-0000-0000-000000000003', 'FIN-M009', 'revenue', 'Vendas — Semana 4', 4500.00, '2026-02-16', NULL),
  ('d0000000-0000-0000-0000-000000000003', 'FIN-M010', 'commission', 'Comissão iFood — Semana 4', -675.00, '2026-02-16', NULL)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- CATALOG CATEGORIES
-- =============================================================================

INSERT INTO public.catalog_categories (id, restaurant_id, ifood_category_id, name, sort_order)
VALUES
  -- Centro
  ('f1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'CAT-C-01', 'Pratos Principais', 1),
  ('f1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'CAT-C-02', 'Hambúrgueres', 2),
  ('f1000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'CAT-C-03', 'Bebidas', 3),
  ('f1000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'CAT-C-04', 'Sobremesas', 4),

  -- Jardins
  ('f1000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'CAT-J-01', 'Executivos', 1),
  ('f1000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', 'CAT-J-02', 'Saladas', 2),
  ('f1000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000002', 'CAT-J-03', 'Bebidas', 3),

  -- Moema
  ('f1000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', 'CAT-M-01', 'Pizzas Tradicionais', 1),
  ('f1000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000003', 'CAT-M-02', 'Pizzas Especiais', 2),
  ('f1000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000003', 'CAT-M-03', 'Bebidas', 3),
  ('f1000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000003', 'CAT-M-04', 'Sobremesas', 4);

-- =============================================================================
-- CATALOG ITEMS
-- =============================================================================

INSERT INTO public.catalog_items (restaurant_id, ifood_item_id, category_id, category_name, name, description, price, is_available)
VALUES
  -- Centro — Pratos
  ('d0000000-0000-0000-0000-000000000001', 'ITEM-C001', 'f1000000-0000-0000-0000-000000000001', 'Pratos Principais', 'Filé Mignon Grelhado', 'Filé mignon grelhado com molho madeira, arroz e batata rústica', 62.90, true),
  ('d0000000-0000-0000-0000-000000000001', 'ITEM-C002', 'f1000000-0000-0000-0000-000000000001', 'Pratos Principais', 'Frango Parmegiana', 'Filé de frango empanado com molho de tomate e queijo gratinado', 42.90, true),
  ('d0000000-0000-0000-0000-000000000001', 'ITEM-C003', 'f1000000-0000-0000-0000-000000000001', 'Pratos Principais', 'Risoto de Camarão', 'Risoto cremoso com camarões e ervas finas', 58.90, true),
  -- Centro — Hambúrgueres
  ('d0000000-0000-0000-0000-000000000001', 'ITEM-C004', 'f1000000-0000-0000-0000-000000000002', 'Hambúrgueres', 'Smash Burger Clássico', 'Dois smash burgers, queijo cheddar, cebola caramelizada, molho especial', 34.90, true),
  ('d0000000-0000-0000-0000-000000000001', 'ITEM-C005', 'f1000000-0000-0000-0000-000000000002', 'Hambúrgueres', 'Burger Bacon Supreme', 'Hambúrguer artesanal, bacon crocante, queijo prato, alface e tomate', 38.90, true),
  -- Centro — Bebidas
  ('d0000000-0000-0000-0000-000000000001', 'ITEM-C006', 'f1000000-0000-0000-0000-000000000003', 'Bebidas', 'Coca-Cola 350ml', 'Coca-Cola lata 350ml', 7.90, true),
  ('d0000000-0000-0000-0000-000000000001', 'ITEM-C007', 'f1000000-0000-0000-0000-000000000003', 'Bebidas', 'Suco Natural Laranja', 'Suco natural de laranja 500ml', 12.90, true),
  -- Centro — Sobremesas
  ('d0000000-0000-0000-0000-000000000001', 'ITEM-C008', 'f1000000-0000-0000-0000-000000000004', 'Sobremesas', 'Pudim de Leite', 'Pudim de leite condensado cremoso', 14.90, true),
  ('d0000000-0000-0000-0000-000000000001', 'ITEM-C009', 'f1000000-0000-0000-0000-000000000004', 'Sobremesas', 'Brownie com Sorvete', 'Brownie de chocolate com sorvete de creme', 18.90, false),

  -- Jardins — Executivos
  ('d0000000-0000-0000-0000-000000000002', 'ITEM-J001', 'f1000000-0000-0000-0000-000000000005', 'Executivos', 'Executivo Frango', 'Frango grelhado, arroz, feijão, salada e farofa', 28.90, true),
  ('d0000000-0000-0000-0000-000000000002', 'ITEM-J002', 'f1000000-0000-0000-0000-000000000005', 'Executivos', 'Executivo Carne', 'Bife acebolado, arroz, feijão, salada e mandioca', 32.90, true),
  ('d0000000-0000-0000-0000-000000000002', 'ITEM-J003', 'f1000000-0000-0000-0000-000000000005', 'Executivos', 'Executivo Peixe', 'Filé de tilápia grelhado, arroz integral, legumes e vinagrete', 35.90, true),
  -- Jardins — Saladas
  ('d0000000-0000-0000-0000-000000000002', 'ITEM-J004', 'f1000000-0000-0000-0000-000000000006', 'Saladas', 'Caesar Salad', 'Alface americana, croutons, parmesão e molho caesar', 26.90, true),
  ('d0000000-0000-0000-0000-000000000002', 'ITEM-J005', 'f1000000-0000-0000-0000-000000000006', 'Saladas', 'Salada Tropical', 'Mix de folhas, manga, palmito e molho de maracujá', 24.90, false),
  -- Jardins — Bebidas
  ('d0000000-0000-0000-0000-000000000002', 'ITEM-J006', 'f1000000-0000-0000-0000-000000000007', 'Bebidas', 'Água Mineral 500ml', 'Água mineral sem gás', 4.90, true),
  ('d0000000-0000-0000-0000-000000000002', 'ITEM-J007', 'f1000000-0000-0000-0000-000000000007', 'Bebidas', 'Guaraná Antarctica 350ml', 'Guaraná lata 350ml', 7.90, true),

  -- Moema — Pizzas Tradicionais
  ('d0000000-0000-0000-0000-000000000003', 'ITEM-M001', 'f1000000-0000-0000-0000-000000000008', 'Pizzas Tradicionais', 'Margherita', 'Molho de tomate, mozzarella, manjericão fresco', 42.90, true),
  ('d0000000-0000-0000-0000-000000000003', 'ITEM-M002', 'f1000000-0000-0000-0000-000000000008', 'Pizzas Tradicionais', 'Calabresa', 'Calabresa fatiada, cebola, azeitona e orégano', 39.90, true),
  ('d0000000-0000-0000-0000-000000000003', 'ITEM-M003', 'f1000000-0000-0000-0000-000000000008', 'Pizzas Tradicionais', 'Portuguesa', 'Presunto, ovo, cebola, azeitona, ervilha e orégano', 44.90, true),
  -- Moema — Pizzas Especiais
  ('d0000000-0000-0000-0000-000000000003', 'ITEM-M004', 'f1000000-0000-0000-0000-000000000009', 'Pizzas Especiais', 'Filé Mignon com Catupiry', 'Filé mignon fatiado, catupiry cremoso e rúcula', 58.90, true),
  ('d0000000-0000-0000-0000-000000000003', 'ITEM-M005', 'f1000000-0000-0000-0000-000000000009', 'Pizzas Especiais', 'Camarão ao Alho', 'Camarões ao alho e óleo, mozzarella e salsinha', 64.90, true),
  -- Moema — Bebidas
  ('d0000000-0000-0000-0000-000000000003', 'ITEM-M006', 'f1000000-0000-0000-0000-000000000010', 'Bebidas', 'Coca-Cola 2L', 'Coca-Cola garrafa 2 litros', 14.90, true),
  ('d0000000-0000-0000-0000-000000000003', 'ITEM-M007', 'f1000000-0000-0000-0000-000000000010', 'Bebidas', 'Cerveja Heineken 600ml', 'Heineken garrafa 600ml', 18.90, true),
  -- Moema — Sobremesas
  ('d0000000-0000-0000-0000-000000000003', 'ITEM-M008', 'f1000000-0000-0000-0000-000000000011', 'Sobremesas', 'Pizza de Chocolate', 'Pizza doce com chocolate ao leite e morango', 38.90, true),
  ('d0000000-0000-0000-0000-000000000003', 'ITEM-M009', 'f1000000-0000-0000-0000-000000000011', 'Sobremesas', 'Petit Gâteau', 'Bolo de chocolate com centro derretido e sorvete', 22.90, true)
ON CONFLICT (ifood_item_id) DO NOTHING;

-- =============================================================================
-- REPORTS (last 3 weeks)
-- =============================================================================

INSERT INTO public.reports (id, restaurant_id, week_start, week_end, status, pdf_url, generated_at)
VALUES
  -- Centro
  ('f2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '2026-01-26', '2026-02-01', 'sent', '/reports/centro-w1.pdf', now() - interval '16 days'),
  ('f2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '2026-02-02', '2026-02-08', 'sent', '/reports/centro-w2.pdf', now() - interval '9 days'),
  ('f2000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', '2026-02-09', '2026-02-15', 'generated', NULL, now() - interval '2 days'),

  -- Jardins
  ('f2000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', '2026-01-26', '2026-02-01', 'sent', '/reports/jardins-w1.pdf', now() - interval '16 days'),
  ('f2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', '2026-02-02', '2026-02-08', 'sent', '/reports/jardins-w2.pdf', now() - interval '9 days'),
  ('f2000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', '2026-02-09', '2026-02-15', 'generated', NULL, now() - interval '2 days'),

  -- Moema
  ('f2000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000003', '2026-01-26', '2026-02-01', 'sent', '/reports/moema-w1.pdf', now() - interval '16 days'),
  ('f2000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', '2026-02-02', '2026-02-08', 'generated', NULL, now() - interval '9 days')
ON CONFLICT (restaurant_id, week_start) DO NOTHING;

-- =============================================================================
-- REPORT SEND LOGS
-- =============================================================================

INSERT INTO public.report_send_logs (report_id, sent_by, channel, status, sent_at)
VALUES
  ('f2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'email', 'sent', now() - interval '15 days'),
  ('f2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'whatsapp', 'sent', now() - interval '15 days'),
  ('f2000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'email', 'sent', now() - interval '8 days'),
  ('f2000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'email', 'sent', now() - interval '15 days'),
  ('f2000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'whatsapp', 'failed', now() - interval '8 days'),
  ('f2000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'email', 'sent', now() - interval '15 days');

-- =============================================================================
-- REPORT INTERNAL CONTENT
-- =============================================================================

INSERT INTO public.report_internal_content (report_id, content, updated_by)
VALUES
  ('f2000000-0000-0000-0000-000000000003', 'Centro apresentou crescimento consistente no funil. Taxa de cancelamento caiu de 3.8% para 3.0%. Sugestão: manter estratégia de promoções e investir em embalagens melhores (feedback recorrente).', 'a0000000-0000-0000-0000-000000000003'),
  ('f2000000-0000-0000-0000-000000000006', 'ALERTA: Jardins em queda livre. Visitas caíram 20% em 4 semanas. Cancelamentos subiram de 4.2% para 6.0%. Principais reclamações: itens faltando, demora na entrega, cancelamentos sem explicação. Recomendação urgente: reunião com gerente da unidade.', 'a0000000-0000-0000-0000-000000000003');

-- =============================================================================
-- ACTIONS
-- =============================================================================

INSERT INTO public.actions (id, report_id, restaurant_id, week_start, title, description, goal, action_type, status, done_evidence, done_by, done_at, discarded_reason, discarded_by, discarded_at, created_by)
VALUES
  -- Centro W2 — mix of statuses
  ('f3000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '2026-02-02',
    'Criar promoção combo almoço', 'Criar combo com prato + bebida + sobremesa com 15% desconto para aumentar ticket médio', 'Aumentar ticket médio em 10%',
    'promotion', 'done', 'Promoção criada no iFood: Combo Almoço Completo por R$49.90', 'a0000000-0000-0000-0000-000000000002', now() - interval '5 days', NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000003'),

  ('f3000000-0000-0000-0000-000000000002', 'f2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '2026-02-02',
    'Melhorar embalagem de saladas', 'Trocar embalagens de salada para modelo com divisórias que evite mistura dos ingredientes', 'Reduzir reclamações sobre embalagem',
    'operational', 'done', 'Novas embalagens com divisórias já em uso. Fornecedor: EmbalaFácil', 'a0000000-0000-0000-0000-000000000002', now() - interval '4 days', NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000003'),

  ('f3000000-0000-0000-0000-000000000003', 'f2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '2026-02-02',
    'Treinar equipe sobre alergias', 'Realizar treinamento com toda a equipe de cozinha sobre preparo de pedidos com restrições alimentares', 'Zero incidentes com alérgicos',
    'operational', 'planned', NULL, NULL, NULL, NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000003'),

  -- Centro W3
  ('f3000000-0000-0000-0000-000000000004', 'f2000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', '2026-02-09',
    'Atualizar fotos do cardápio', 'Fotografar profissionalmente os 5 pratos mais vendidos para melhorar conversão', 'Aumentar taxa de conversão view→cart em 5%',
    'marketing', 'planned', NULL, NULL, NULL, NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000003'),

  ('f3000000-0000-0000-0000-000000000005', 'f2000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', '2026-02-09',
    'Adicionar opção sem glúten', 'Incluir pelo menos 3 opções sem glúten no cardápio para atender demanda crescente', 'Capturar segmento sem glúten',
    'menu_adjustment', 'planned', NULL, NULL, NULL, NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000003'),

  -- Jardins W2 — urgent actions
  ('f3000000-0000-0000-0000-000000000006', 'f2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', '2026-02-02',
    'Revisão geral do processo de montagem', 'Auditar todo o processo de montagem de pedidos para eliminar itens faltantes', 'Zerar reclamações de itens faltando',
    'operational', 'discarded', NULL, NULL, NULL, 'Decidimos terceirizar auditoria de processos. Ação substituída.', 'a0000000-0000-0000-0000-000000000002', now() - interval '3 days', 'a0000000-0000-0000-0000-000000000003'),

  ('f3000000-0000-0000-0000-000000000007', 'f2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', '2026-02-02',
    'Contratar motoboy dedicado', 'Contratar motoboy fixo para reduzir tempo de entrega nos horários de pico', 'Reduzir tempo médio de entrega em 15min',
    'operational', 'planned', NULL, NULL, NULL, NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000003'),

  -- Jardins W3
  ('f3000000-0000-0000-0000-000000000008', 'f2000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', '2026-02-09',
    'Campanha de recuperação de clientes', 'Criar cupom de 20% para clientes que não pedem há mais de 2 semanas', 'Recuperar pelo menos 30% dos clientes inativos',
    'marketing', 'planned', NULL, NULL, NULL, NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000003'),

  ('f3000000-0000-0000-0000-000000000009', 'f2000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', '2026-02-09',
    'Reunião urgente com equipe Jardins', 'Reunião presencial para discutir queda de performance e plano de ação', 'Alinhar equipe e definir metas de recuperação',
    'operational', 'planned', NULL, NULL, NULL, NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- CHECKLISTS
-- =============================================================================

INSERT INTO public.checklists (report_id, restaurant_id, week_start, title, is_checked, checked_by, checked_at)
VALUES
  -- Centro W3 (current week)
  ('f2000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', '2026-02-09', 'Verificar estoque de embalagens', true, 'a0000000-0000-0000-0000-000000000002', now() - interval '1 day'),
  ('f2000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', '2026-02-09', 'Conferir cardápio no iFood (preços/disponibilidade)', true, 'a0000000-0000-0000-0000-000000000002', now() - interval '1 day'),
  ('f2000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', '2026-02-09', 'Responder avaliações pendentes', false, NULL, NULL),
  ('f2000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', '2026-02-09', 'Acompanhar taxa de cancelamento', false, NULL, NULL),
  ('f2000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', '2026-02-09', 'Revisar tempo médio de preparo', false, NULL, NULL),

  -- Jardins W3
  ('f2000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', '2026-02-09', 'Auditar montagem de pedidos (verificar itens)', false, NULL, NULL),
  ('f2000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', '2026-02-09', 'Verificar e atualizar preços no iFood', false, NULL, NULL),
  ('f2000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', '2026-02-09', 'Responder todos os tickets abertos', false, NULL, NULL),
  ('f2000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', '2026-02-09', 'Agendar reunião com equipe', false, NULL, NULL);

-- =============================================================================
-- IMAGE JOBS
-- =============================================================================

INSERT INTO public.image_jobs (id, restaurant_id, catalog_item_id, mode, status, prompt, original_image_url, result_image_url, created_by)
VALUES
  ('f4000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
    (SELECT id FROM public.catalog_items WHERE ifood_item_id = 'ITEM-C001'),
    'generate', 'completed',
    'Professional food photography of a grilled filet mignon with madeira sauce, rice and rustic potatoes on a white plate, restaurant lighting',
    NULL, 'https://placehold.co/800x600/FFF/333?text=Fil%C3%A9+Mignon',
    'a0000000-0000-0000-0000-000000000003'),

  ('f4000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001',
    (SELECT id FROM public.catalog_items WHERE ifood_item_id = 'ITEM-C004'),
    'generate', 'processing',
    'Professional food photography of a double smash burger with cheddar cheese and caramelized onions, side view, dark background',
    NULL, NULL,
    'a0000000-0000-0000-0000-000000000003'),

  ('f4000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003',
    (SELECT id FROM public.catalog_items WHERE ifood_item_id = 'ITEM-M001'),
    'improve', 'completed',
    'Enhance this pizza photo: better lighting, more appetizing, professional food photography style',
    'https://placehold.co/800x600/FFF/333?text=Original+Pizza',
    'https://placehold.co/800x600/FFF/333?text=Improved+Pizza',
    'a0000000-0000-0000-0000-000000000002'),

  ('f4000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003',
    (SELECT id FROM public.catalog_items WHERE ifood_item_id = 'ITEM-M005'),
    'generate', 'failed',
    'Professional photo of a shrimp pizza with garlic and olive oil',
    NULL, NULL,
    'a0000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- IMAGE JOB LOGS
-- =============================================================================

INSERT INTO public.image_job_logs (image_job_id, action, performed_by, details)
VALUES
  ('f4000000-0000-0000-0000-000000000001', 'created', 'a0000000-0000-0000-0000-000000000003', '{"prompt": "Professional food photography of grilled filet mignon"}'::jsonb),
  ('f4000000-0000-0000-0000-000000000001', 'completed', NULL, '{"generation_time_ms": 12500}'::jsonb),
  ('f4000000-0000-0000-0000-000000000002', 'created', 'a0000000-0000-0000-0000-000000000003', '{"prompt": "Professional food photography of smash burger"}'::jsonb),
  ('f4000000-0000-0000-0000-000000000003', 'created', 'a0000000-0000-0000-0000-000000000002', '{"mode": "improve"}'::jsonb),
  ('f4000000-0000-0000-0000-000000000003', 'completed', NULL, '{"generation_time_ms": 8200}'::jsonb),
  ('f4000000-0000-0000-0000-000000000004', 'created', 'a0000000-0000-0000-0000-000000000002', '{"prompt": "Professional photo of shrimp pizza"}'::jsonb),
  ('f4000000-0000-0000-0000-000000000004', 'failed', NULL, '{"error": "Content policy violation: regenerate with different prompt"}'::jsonb);

-- =============================================================================
-- WHATSAPP INSTANCE
-- =============================================================================

INSERT INTO public.whatsapp_instances (id, uazapi_instance_id, instance_token, name, status, phone_number, profile_name, is_business, webhook_enabled, created_by)
VALUES (
  'f5000000-0000-0000-0000-000000000001',
  'mock-instance-001',
  'mock-token-whatsapp-001',
  'GTBI Principal',
  'connected',
  '+5511999887766',
  'GTBI Relatórios',
  true,
  true,
  'a0000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- AUDIT LOGS (sample entries)
-- =============================================================================

INSERT INTO public.audit_logs (user_id, action, entity, entity_id, new_data, ip_address)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'connect_ifood_account', 'ifood_accounts', 'c0000000-0000-0000-0000-000000000001', '{"name": "Grupo Sabor & Arte", "merchant_id": "MOCK-MERCHANT-001"}'::jsonb, '127.0.0.1'),
  ('a0000000-0000-0000-0000-000000000001', 'connect_ifood_account', 'ifood_accounts', 'c0000000-0000-0000-0000-000000000002', '{"name": "Rede Bom Prato", "merchant_id": "MOCK-MERCHANT-002"}'::jsonb, '127.0.0.1'),
  ('a0000000-0000-0000-0000-000000000001', 'invite_user', 'user_profiles', 'a0000000-0000-0000-0000-000000000002', '{"email": "gerente@gtbi.dev", "role": "gerente"}'::jsonb, '127.0.0.1'),
  ('a0000000-0000-0000-0000-000000000001', 'invite_user', 'user_profiles', 'a0000000-0000-0000-0000-000000000003', '{"email": "analista@gtbi.dev", "role": "analista"}'::jsonb, '127.0.0.1'),
  ('a0000000-0000-0000-0000-000000000001', 'invite_user', 'user_profiles', 'a0000000-0000-0000-0000-000000000004', '{"email": "viewer@gtbi.dev", "role": "viewer"}'::jsonb, '127.0.0.1'),
  ('a0000000-0000-0000-0000-000000000002', 'send_report', 'reports', 'f2000000-0000-0000-0000-000000000001', '{"channel": "email", "restaurant": "Sabor & Arte — Centro"}'::jsonb, '192.168.1.10'),
  ('a0000000-0000-0000-0000-000000000002', 'send_report', 'reports', 'f2000000-0000-0000-0000-000000000001', '{"channel": "whatsapp", "restaurant": "Sabor & Arte — Centro"}'::jsonb, '192.168.1.10'),
  ('a0000000-0000-0000-0000-000000000003', 'generate_image', 'image_jobs', 'f4000000-0000-0000-0000-000000000001', '{"catalog_item": "Filé Mignon Grelhado", "mode": "generate"}'::jsonb, '192.168.1.15'),
  ('a0000000-0000-0000-0000-000000000002', 'toggle_auto_reply', 'restaurants', 'd0000000-0000-0000-0000-000000000001', '{"review_auto_reply_enabled": true, "mode": "ai"}'::jsonb, '192.168.1.10'),
  ('a0000000-0000-0000-0000-000000000001', 'connect_whatsapp', 'whatsapp_instances', 'f5000000-0000-0000-0000-000000000001', '{"name": "GTBI Principal", "phone": "+5511999887766"}'::jsonb, '127.0.0.1');

-- =============================================================================
-- DATA COLLECTION LOGS
-- =============================================================================

INSERT INTO public.data_collection_logs (restaurant_id, collection_type, status, items_collected, started_at, completed_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'performance', 'success', 1, now() - interval '2 hours 5 minutes', now() - interval '2 hours 4 minutes'),
  ('d0000000-0000-0000-0000-000000000001', 'orders', 'success', 10, now() - interval '2 hours 4 minutes', now() - interval '2 hours 3 minutes'),
  ('d0000000-0000-0000-0000-000000000001', 'reviews', 'success', 8, now() - interval '2 hours 3 minutes', now() - interval '2 hours 2 minutes'),
  ('d0000000-0000-0000-0000-000000000001', 'financial', 'success', 15, now() - interval '2 hours 2 minutes', now() - interval '2 hours 1 minute'),
  ('d0000000-0000-0000-0000-000000000002', 'performance', 'success', 1, now() - interval '2 hours', now() - interval '1 hour 59 minutes'),
  ('d0000000-0000-0000-0000-000000000002', 'orders', 'success', 8, now() - interval '1 hour 59 minutes', now() - interval '1 hour 58 minutes'),
  ('d0000000-0000-0000-0000-000000000002', 'reviews', 'failed', 0, now() - interval '1 hour 58 minutes', now() - interval '1 hour 57 minutes'),
  ('d0000000-0000-0000-0000-000000000003', 'performance', 'success', 1, now() - interval '1 hour 55 minutes', now() - interval '1 hour 54 minutes'),
  ('d0000000-0000-0000-0000-000000000003', 'orders', 'success', 8, now() - interval '1 hour 54 minutes', now() - interval '1 hour 53 minutes'),
  ('d0000000-0000-0000-0000-000000000003', 'catalog', 'success', 25, now() - interval '1 hour 53 minutes', now() - interval '1 hour 52 minutes');
