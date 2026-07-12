-- Migración 136: Agenda A-1 — disponibilidad (appointment_settings) + bloqueos (blocked_periods)
-- + reserva por servicio (reserve_type/reserve_price en tenant_landing_services). RLS tenant-scoped + CEO.
create table if not exists public.appointment_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  timezone text not null default 'America/Puerto_Rico',
  buffer_minutes int not null default 15,
  weekly_schedule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.appointment_settings enable row level security;
create policy appointment_settings_select on public.appointment_settings for select using (tenant_id = current_tenant());
create policy appointment_settings_all on public.appointment_settings for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above())
  with check (tenant_id = current_tenant() and public.is_ceo_or_above());

create table if not exists public.blocked_periods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  is_full_day boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists idx_blocked_periods_tenant_range on public.blocked_periods(tenant_id, starts_at, ends_at);
alter table public.blocked_periods enable row level security;
create policy blocked_periods_select on public.blocked_periods for select using (tenant_id = current_tenant());
create policy blocked_periods_all on public.blocked_periods for all
  using (tenant_id = current_tenant() and public.is_ceo_or_above())
  with check (tenant_id = current_tenant() and public.is_ceo_or_above());

alter table public.tenant_landing_services
  add column if not exists reserve_type text check (reserve_type in ('none','free','deposit','full')) default 'none',
  add column if not exists reserve_price numeric(10,2);
