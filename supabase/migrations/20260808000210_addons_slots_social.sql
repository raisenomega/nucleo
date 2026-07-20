-- 210 · Cierra 3 gaps de la sonda #14: (A) Pricing Add-ons, (B) bloqueo por FRANJAS horarias,
-- (C) footer social links flexibles (tabla, reemplaza las 6 columnas fijas).
-- OMEGA tiene blocked_hours pero SIN UI (solo día completo) → aquí se implementa la franja start/end real.

-- ═══ A · PRICING ADD-ONS (patrón landing_pricing_addons de OMEGA + currency/billing_period de NÚCLEO) ═══
create table if not exists public.marketing_pricing_addons (
  id uuid primary key default gen_random_uuid(),
  name_es text not null default '', name_en text not null default '',
  description_es text not null default '', description_en text not null default '',
  price numeric(10,2) not null default 0,
  currency text not null default 'USD',
  billing_period text not null default 'month' check (billing_period in ('month','year','one_time')),
  is_active boolean not null default true,
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);
drop trigger if exists set_marketing_pricing_addons_updated_at on public.marketing_pricing_addons;
create trigger set_marketing_pricing_addons_updated_at before update on public.marketing_pricing_addons
  for each row execute function public.set_updated_at();
insert into public.marketing_pricing_addons (name_es, name_en, description_es, description_en, price, display_order)
select * from (values
  ('Módulo adicional','Additional module','Agrega cualquier módulo extra a tu plan.','Add any extra module to your plan.',29,1),
  ('Agente IA dedicado','Dedicated AI agent','Un agente entrenado exclusivamente en tu negocio.','An agent trained exclusively on your business.',49,2),
  ('Soporte premium','Premium support','Soporte 24/7 con SLA garantizado.','24/7 support with guaranteed SLA.',99,3)
) v where not exists (select 1 from public.marketing_pricing_addons);
alter table public.marketing_pricing_addons enable row level security;
drop policy if exists maddon_select on public.marketing_pricing_addons;
create policy maddon_select on public.marketing_pricing_addons for select using (true);
drop policy if exists maddon_admin on public.marketing_pricing_addons;
create policy maddon_admin on public.marketing_pricing_addons for all using (public.is_superadmin()) with check (public.is_superadmin());

-- ═══ B · BLOQUEO POR FRANJAS (start_time/end_time NULL = día completo) ═══
alter table public.marketing_blocked_dates
  add column if not exists start_time time,
  add column if not exists end_time time;
-- una fecha puede tener varias franjas → se quita el UNIQUE por fecha
alter table public.marketing_blocked_dates drop constraint if exists marketing_blocked_dates_blocked_date_key;

-- RPC slots: resta día completo (start_time null) Y franjas parciales [start, end)
create or replace function public._marketing_available_slots(_date date)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare _c record; _step int; _t time; _slots jsonb := '[]'::jsonb; _taken time[]; _cnt int; _today date; _nowt time;
begin
  select * into _c from public.marketing_availability limit 1;
  if _c is null then return '[]'::jsonb; end if;
  _today := (now() at time zone _c.timezone)::date; _nowt := (now() at time zone _c.timezone)::time;
  if _date < _today or _date > _today + 30 then return '[]'::jsonb; end if;
  if not (extract(dow from _date)::int = any(_c.available_days)) then return '[]'::jsonb; end if;
  -- bloqueo de DÍA COMPLETO
  if exists (select 1 from public.marketing_blocked_dates where blocked_date = _date and start_time is null) then return '[]'::jsonb; end if;
  select count(*) into _cnt from public.marketing_reservations where reservation_date=_date and status <> 'cancelled';
  if _c.max_per_day > 0 and _cnt >= _c.max_per_day then return '[]'::jsonb; end if;
  select coalesce(array_agg(reservation_time), '{}') into _taken from public.marketing_reservations where reservation_date=_date and status <> 'cancelled';
  _step := greatest(_c.duration_minutes + _c.buffer_minutes, 5);
  _t := _c.hours_start;
  while _t + make_interval(mins => _c.duration_minutes) <= _c.hours_end loop
    if not (_t = any(_taken))
       and not (_date = _today and _t <= _nowt)
       -- FRANJA parcial bloqueada: [start_time, end_time)
       and not exists (select 1 from public.marketing_blocked_dates b
             where b.blocked_date = _date and b.start_time is not null and _t >= b.start_time and _t < b.end_time)
    then _slots := _slots || to_jsonb(to_char(_t, 'HH24:MI')); end if;
    _t := _t + make_interval(mins => _step);
  end loop;
  return _slots;
end $fn$;
grant execute on function public._marketing_available_slots(date) to anon, authenticated;

-- ═══ C · FOOTER SOCIAL LINKS FLEXIBLES (tabla; las 6 columnas de marketing_footer quedan DEPRECATED) ═══
create table if not exists public.marketing_footer_social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  icon_name text not null default 'Globe',
  display_order int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists set_marketing_footer_social_links_updated_at on public.marketing_footer_social_links;
create trigger set_marketing_footer_social_links_updated_at before update on public.marketing_footer_social_links
  for each row execute function public.set_updated_at();
-- migra lo que hubiera en las columnas fijas (solo si la tabla está vacía)
insert into public.marketing_footer_social_links (platform, url, icon_name, display_order)
select v.platform, v.url, v.icon, v.ord
from public.marketing_footer f,
lateral (values
  ('Instagram', f.social_instagram, 'Camera', 1), ('Facebook', f.social_facebook, 'ThumbsUp', 2),
  ('LinkedIn', f.social_linkedin, 'Briefcase', 3), ('YouTube', f.social_youtube, 'Play', 4),
  ('TikTok', f.social_tiktok, 'Music', 5), ('X', f.social_x, 'AtSign', 6)
) as v(platform, url, icon, ord)
where coalesce(v.url,'') <> '' and not exists (select 1 from public.marketing_footer_social_links);
alter table public.marketing_footer_social_links enable row level security;
drop policy if exists msocial_select on public.marketing_footer_social_links;
create policy msocial_select on public.marketing_footer_social_links for select using (true);
drop policy if exists msocial_admin on public.marketing_footer_social_links;
create policy msocial_admin on public.marketing_footer_social_links for all using (public.is_superadmin()) with check (public.is_superadmin());
