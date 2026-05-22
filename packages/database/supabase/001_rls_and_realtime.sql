-- Supabase: RLS policies and Realtime (run in SQL editor or migration pipeline).
-- Assumes auth.users exists and profiles.id = auth.users.id.

create extension if not exists "pgcrypto";

-- Realtime: expose orders and crm_stage_events (safe to ignore if already added)
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.crm_stage_events;

-- Helper: read JWT role from app_metadata (configure in Supabase Auth hooks / user metadata)
-- Policies below use coalesce for local dev without JWT.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.blog_posts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.crm_notes enable row level security;
alter table public.crm_stage_events enable row level security;
alter table public.ai_drafts enable row level security;

-- Profiles: user can read/update own row
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Staff (admin / sales): full CRUD on operational tables
create policy "staff_all_profiles"
  on public.profiles for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'sales'));

create policy "staff_all_orders"
  on public.orders for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'sales'));

create policy "staff_all_order_items"
  on public.order_items for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'sales'));

create policy "staff_all_crm_notes"
  on public.crm_notes for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'sales'));

create policy "staff_all_crm_stage_events"
  on public.crm_stage_events for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'sales'));

create policy "staff_all_ai_drafts"
  on public.ai_drafts for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'sales'));

-- Admin-only sensitive columns access pattern: use separate table or service role from server.
create policy "admin_all_categories"
  on public.categories for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'sales'));

create policy "admin_all_products"
  on public.products for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'sales'));

create policy "admin_all_product_images"
  on public.product_images for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'sales'));

create policy "admin_all_blog_posts"
  on public.blog_posts for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'sales'));

-- Public storefront: read published catalog
create policy "anon_read_published_products"
  on public.products for select
  using (workflow = 'published');

create policy "anon_read_product_images"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.workflow = 'published'
    )
  );

create policy "anon_read_categories"
  on public.categories for select
  using (true);

create policy "anon_read_published_blog"
  on public.blog_posts for select
  using (workflow = 'published');

-- Customers: read own orders
create policy "customer_read_own_orders"
  on public.orders for select
  using (auth.uid() is not null and customer_profile_id = auth.uid());

create policy "customer_read_own_order_items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.customer_profile_id = auth.uid()
    )
  );
