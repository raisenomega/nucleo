-- OFERTAS-HOOK-STRIPE Rodaja 2a: tabla de ofertas configurables (funnel del hook $19.98, aislado del catálogo).
-- El billing real del hook (Stripe Subscription Schedule + reversión) es 2b — aquí solo el schema + CMS + chip.
-- Las ofertas nacen inactivas (is_active=false); no activar hasta que 2b cablee el cobro real.
create table if not exists public.tenant_landing_offers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  is_active boolean not null default false,
  title_es text not null default '', title_en text not null default '',           -- título interno (CMS)
  badge_text_es text not null default 'OFERTA TRENDING', badge_text_en text not null default 'TRENDING OFFER',
  hook_price numeric not null default 0,
  applicable_services jsonb not null default '[]'::jsonb,                          -- array de service_ids
  commitment_cycles int not null default 3,
  disclosure_es text not null default '', disclosure_en text not null default '',
  cta_label_es text not null default 'Aprovechar oferta', cta_label_en text not null default 'Get offer',
  ask_service_type boolean not null default true,
  modal_question_es text not null default '¿Qué opción prefieres?',
  modal_question_en text not null default 'Which option do you prefer?',
  valid_from timestamptz, valid_until timestamptz,
  display_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_landing_offers_tenant_active on public.tenant_landing_offers(tenant_id, is_active);

alter table public.tenant_landing_offers enable row level security;
create policy tenant_landing_offers_select on public.tenant_landing_offers for select using (tenant_id = public.current_tenant());
create policy tenant_landing_offers_all on public.tenant_landing_offers for all
  using (tenant_id = public.current_tenant() and public.is_ceo_or_above())
  with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());

create trigger trg_landing_offers_updated before update on public.tenant_landing_offers
  for each row execute function public.set_updated_at();

-- Chip público: primera oferta activa y vigente del tenant (definer; el público no lee la tabla directo).
create or replace function public._public_get_active_offer(_hostname text)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare _t uuid; _o jsonb;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return null; end if;
  select to_jsonb(o) into _o from public.tenant_landing_offers o
   where o.tenant_id = _t and o.is_active
     and (o.valid_from is null or o.valid_from <= now())
     and (o.valid_until is null or o.valid_until >= now())
   order by o.display_order asc, o.created_at asc limit 1;
  return _o;
end $$;
revoke all on function public._public_get_active_offer(text) from public;
grant execute on function public._public_get_active_offer(text) to anon, authenticated;
