-- 20260217200007_ifood_entities.sql
-- iFood data entities: restaurant_snapshots, orders, reviews, tickets,
-- ticket_messages, financial_entries, catalog_categories, catalog_items,
-- data_collection_logs

-- ============================================
-- RESTAURANT SNAPSHOTS (weekly performance data)
-- ============================================

CREATE TABLE IF NOT EXISTS public.restaurant_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  visits INT DEFAULT 0,
  views INT DEFAULT 0,
  to_cart INT DEFAULT 0,
  checkout INT DEFAULT 0,
  completed INT DEFAULT 0,
  cancellation_rate NUMERIC(5,4) DEFAULT 0,
  open_time_rate NUMERIC(5,4) DEFAULT 0,
  open_tickets_rate NUMERIC(5,4) DEFAULT 0,
  new_customers_rate NUMERIC(5,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (restaurant_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_snapshots_restaurant_id
  ON public.restaurant_snapshots(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_snapshots_week_start
  ON public.restaurant_snapshots(week_start);

CREATE INDEX IF NOT EXISTS idx_restaurant_snapshots_restaurant_week
  ON public.restaurant_snapshots(restaurant_id, week_start);

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  ifood_order_id TEXT UNIQUE,
  status TEXT,
  total NUMERIC(10,2),
  items_count INT,
  customer_name TEXT,
  order_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id
  ON public.orders(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_orders_ifood_order_id
  ON public.orders(ifood_order_id);

CREATE INDEX IF NOT EXISTS idx_orders_order_date
  ON public.orders(order_date);

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON public.orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_date
  ON public.orders(restaurant_id, order_date);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  ifood_review_id TEXT UNIQUE,
  order_id TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  customer_name TEXT,
  review_date TIMESTAMPTZ,
  response TEXT,
  response_sent_at TIMESTAMPTZ,
  response_mode TEXT CHECK (response_mode IN ('manual', 'template', 'ai')),
  response_status TEXT CHECK (response_status IN ('pending', 'sent', 'failed')),
  response_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id
  ON public.reviews(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_reviews_ifood_review_id
  ON public.reviews(ifood_review_id);

CREATE INDEX IF NOT EXISTS idx_reviews_review_date
  ON public.reviews(review_date);

CREATE INDEX IF NOT EXISTS idx_reviews_rating
  ON public.reviews(rating);

CREATE INDEX IF NOT EXISTS idx_reviews_response_status
  ON public.reviews(response_status);

CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_date
  ON public.reviews(restaurant_id, review_date);

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- TICKETS
-- ============================================

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  ifood_ticket_id TEXT UNIQUE,
  order_id TEXT,
  subject TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_restaurant_id
  ON public.tickets(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_tickets_ifood_ticket_id
  ON public.tickets(ifood_ticket_id);

CREATE INDEX IF NOT EXISTS idx_tickets_status
  ON public.tickets(status);

CREATE INDEX IF NOT EXISTS idx_tickets_restaurant_status
  ON public.tickets(restaurant_id, status);

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- TICKET MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  ifood_message_id TEXT,
  sender TEXT CHECK (sender IN ('customer', 'restaurant', 'system')),
  content TEXT NOT NULL,
  response_mode TEXT CHECK (response_mode IN ('manual', 'template', 'ai')),
  response_status TEXT CHECK (response_status IN ('pending', 'sent', 'failed')),
  response_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id
  ON public.ticket_messages(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender
  ON public.ticket_messages(sender);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_response_status
  ON public.ticket_messages(response_status);

-- ============================================
-- FINANCIAL ENTRIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  ifood_entry_id TEXT,
  entry_type TEXT CHECK (entry_type IN ('revenue', 'fee', 'promotion', 'refund', 'adjustment', 'delivery_fee', 'commission', 'other')),
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  reference_date DATE NOT NULL,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_financial_entries_restaurant_id
  ON public.financial_entries(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_financial_entries_reference_date
  ON public.financial_entries(reference_date);

CREATE INDEX IF NOT EXISTS idx_financial_entries_entry_type
  ON public.financial_entries(entry_type);

CREATE INDEX IF NOT EXISTS idx_financial_entries_restaurant_date
  ON public.financial_entries(restaurant_id, reference_date);

CREATE INDEX IF NOT EXISTS idx_financial_entries_ifood_entry_id
  ON public.financial_entries(ifood_entry_id);

-- ============================================
-- CATALOG CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  ifood_category_id TEXT,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_categories_restaurant_id
  ON public.catalog_categories(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_catalog_categories_ifood_category_id
  ON public.catalog_categories(ifood_category_id);

-- ============================================
-- CATALOG ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  ifood_item_id TEXT UNIQUE,
  category_id UUID REFERENCES public.catalog_categories(id),
  category_name TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_restaurant_id
  ON public.catalog_items(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_catalog_items_category_id
  ON public.catalog_items(category_id);

CREATE INDEX IF NOT EXISTS idx_catalog_items_ifood_item_id
  ON public.catalog_items(ifood_item_id);

CREATE INDEX IF NOT EXISTS idx_catalog_items_is_available
  ON public.catalog_items(is_available);

CREATE TRIGGER catalog_items_updated_at
  BEFORE UPDATE ON public.catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- DATA COLLECTION LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.data_collection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  collection_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('success', 'failed')),
  items_collected INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_data_collection_logs_restaurant_id
  ON public.data_collection_logs(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_data_collection_logs_collection_type
  ON public.data_collection_logs(collection_type);

CREATE INDEX IF NOT EXISTS idx_data_collection_logs_status
  ON public.data_collection_logs(status);

CREATE INDEX IF NOT EXISTS idx_data_collection_logs_created_at
  ON public.data_collection_logs(created_at DESC);

-- ============================================
-- RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.restaurant_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_collection_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: restaurant_snapshots
-- ============================================

CREATE POLICY "restaurant_snapshots_select_own"
  ON public.restaurant_snapshots
  FOR SELECT
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "restaurant_snapshots_insert_admin"
  ON public.restaurant_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'restaurants', 'create'));

-- ============================================
-- RLS POLICIES: orders
-- ============================================

CREATE POLICY "orders_select_own"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "orders_insert_admin"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'restaurants', 'create'));

-- ============================================
-- RLS POLICIES: reviews
-- ============================================

CREATE POLICY "reviews_select_own"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "reviews_insert_admin"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'reviews', 'create'));

CREATE POLICY "reviews_update_own"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id))
  WITH CHECK (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

-- ============================================
-- RLS POLICIES: tickets
-- ============================================

CREATE POLICY "tickets_select_own"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "tickets_insert_admin"
  ON public.tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'tickets', 'create'));

CREATE POLICY "tickets_update_own"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id))
  WITH CHECK (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

-- ============================================
-- RLS POLICIES: ticket_messages
-- ============================================

CREATE POLICY "ticket_messages_select_own"
  ON public.ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.tickets
      WHERE public.user_has_restaurant_access((select auth.uid()), restaurant_id)
    )
  );

CREATE POLICY "ticket_messages_insert_own"
  ON public.ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.tickets
      WHERE public.user_has_restaurant_access((select auth.uid()), restaurant_id)
    )
  );

-- ============================================
-- RLS POLICIES: financial_entries
-- ============================================

CREATE POLICY "financial_entries_select_own"
  ON public.financial_entries
  FOR SELECT
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "financial_entries_insert_admin"
  ON public.financial_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'financial', 'create'));

-- ============================================
-- RLS POLICIES: catalog_categories
-- ============================================

CREATE POLICY "catalog_categories_select_own"
  ON public.catalog_categories
  FOR SELECT
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "catalog_categories_insert_admin"
  ON public.catalog_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'catalog', 'create'));

CREATE POLICY "catalog_categories_update_own"
  ON public.catalog_categories
  FOR UPDATE
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id))
  WITH CHECK (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

-- ============================================
-- RLS POLICIES: catalog_items
-- ============================================

CREATE POLICY "catalog_items_select_own"
  ON public.catalog_items
  FOR SELECT
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "catalog_items_insert_admin"
  ON public.catalog_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'catalog', 'create'));

CREATE POLICY "catalog_items_update_own"
  ON public.catalog_items
  FOR UPDATE
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id))
  WITH CHECK (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

-- ============================================
-- RLS POLICIES: data_collection_logs
-- ============================================

CREATE POLICY "data_collection_logs_select_own"
  ON public.data_collection_logs
  FOR SELECT
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "data_collection_logs_insert_admin"
  ON public.data_collection_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'restaurants', 'create'));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.restaurant_snapshots IS 'Weekly performance snapshots for restaurants (visits, views, funnel metrics)';
COMMENT ON TABLE public.orders IS 'iFood orders synced from merchant accounts';
COMMENT ON TABLE public.reviews IS 'Customer reviews with auto-reply tracking';
COMMENT ON TABLE public.tickets IS 'Customer support tickets from iFood';
COMMENT ON TABLE public.ticket_messages IS 'Messages within support tickets';
COMMENT ON TABLE public.financial_entries IS 'Financial transactions (revenue, fees, commissions, etc.)';
COMMENT ON TABLE public.catalog_categories IS 'Menu categories for restaurant catalogs';
COMMENT ON TABLE public.catalog_items IS 'Individual menu items in restaurant catalogs';
COMMENT ON TABLE public.data_collection_logs IS 'Logs for automated data collection runs';
