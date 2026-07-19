-- Portal P4 (1/2) — evaluaciones del cliente. Tabla nueva; el customer crea/ve las suyas, el staff las lee y responde.
create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  order_id uuid references public.tenant_landing_orders(id) on delete set null,
  route_stop_id uuid references public.route_stops(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  would_recommend boolean,
  photo_urls text[] not null default '{}',
  is_public boolean not null default false,
  reply text, replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_customer_reviews_tenant on public.customer_reviews(tenant_id);
alter table public.customer_reviews enable row level security;

-- Customer: ve y crea las suyas (ancladas a su customer_profile).
create policy cr_customer_select on public.customer_reviews for select
  using (customer_profile_id in (select id from public.customer_profiles where user_id = auth.uid()));
create policy cr_customer_insert on public.customer_reviews for insert
  with check (customer_profile_id in (select id from public.customer_profiles where user_id = auth.uid()));
-- Staff: lee las de su tenant (panel /reviews + testimonios) y responde/publica.
create policy cr_staff_select on public.customer_reviews for select using (tenant_id = current_tenant());
create policy cr_staff_update on public.customer_reviews for update using (tenant_id = current_tenant() and public.is_ceo_or_above());
comment on table public.customer_reviews is 'Evaluaciones del cliente (Portal). El cliente crea; el staff responde/publica (is_public → testimonios landing).';
