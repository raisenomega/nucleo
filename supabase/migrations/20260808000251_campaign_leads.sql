-- =============================================
-- LANDING PAGES DE CAMPAÑA — R2: formulario + leads a los pipelines EXISTENTES
-- NO hay tabla campaign_leads (sería un tercer silo). El RPC ramifica por host: tenant→leads (CRM, reutiliza
-- inbox + Kanban + auto-enlace al maestro 2.6d + notificaciones), plataforma→marketing_leads (inbox superadmin).
-- Ambas ganan campaign_page_id + attribution jsonb (utm_* completos + fbclid/gclid + referrer + landing_path).
-- =============================================

alter table public.leads
  add column if not exists campaign_page_id uuid references public.campaign_pages(id) on delete set null,
  add column if not exists attribution jsonb;
alter table public.marketing_leads
  add column if not exists campaign_page_id uuid references public.campaign_pages(id) on delete set null,
  add column if not exists attribution jsonb;
create index if not exists idx_leads_campaign on public.leads (campaign_page_id) where campaign_page_id is not null;
create index if not exists idx_mkt_leads_campaign on public.marketing_leads (campaign_page_id) where campaign_page_id is not null;

-- Captura de leads desde un bloque Formulario de campaña. Anon-callable. Reutiliza el rate-limit de la landing
-- (_public_rate_hit). El auto-enlace al maestro (2.6d) y las notificaciones son triggers de `leads` → se disparan
-- solos al INSERT (no se replican acá). Honeypot silencioso: campo trampa lleno → 'ok' sin crear nada.
create or replace function public._campaign_create_lead(_host text, _payload jsonb, _client_ip text default 'unknown')
 returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $function$
declare _sentinel uuid := '00000000-0000-0000-0000-0000000000a1'; _h text := lower(trim(coalesce(_host,'')));
  _tenant uuid; _page public.campaign_pages; _name text; _email text; _phone text; _hits int; _lead uuid; _ceo uuid;
  _attr jsonb := coalesce(_payload->'attribution','{}'::jsonb);
begin
  -- honeypot: si el campo trampa viene lleno, un bot lo llenó → ok silencioso, no crea nada
  if coalesce(_payload->>'hp','') <> '' then return jsonb_build_object('status','ok'); end if;
  _tenant := public._landing_resolve_tenant(_h);
  if _tenant is null then
    if regexp_replace(_h,'^www\.','') in ('nucleoraisen.com','nucleo-blush.vercel.app','localhost') then _tenant := _sentinel;
    else return jsonb_build_object('status','error','code','origin_not_allowed'); end if;
  end if;
  select * into _page from public.campaign_pages where id=(_payload->>'page_id')::uuid and tenant_id=_tenant and is_published;
  if _page.id is null then return jsonb_build_object('status','error','code','page_not_found'); end if;
  _name := trim(coalesce(_payload->>'customer_name','')); _email := lower(trim(coalesce(_payload->>'customer_email','')));
  _phone := coalesce(_payload->>'customer_phone','');
  if _name = '' or _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('status','error','code','invalid_payload'); end if;
  _hits := public._public_rate_hit(encode(extensions.digest(_h||'|'||_email||'|'||coalesce(nullif(_client_ip,''),'unknown'),'sha256'),'hex'));
  if _hits > 5 then return jsonb_build_object('status','error','code','rate_limited'); end if;
  if _tenant = _sentinel then
    insert into public.marketing_leads (lead_type, customer_name, customer_email, customer_phone, message, status,
      campaign_page_id, attribution, utm_source, utm_medium, utm_campaign)
    values ('business', _name, _email, nullif(_phone,''), _payload->>'message', 'new',
      _page.id, _attr, _attr->>'utm_source', _attr->>'utm_medium', _attr->>'utm_campaign') returning id into _lead;
  else
    select user_id into _ceo from public.user_roles where tenant_id=_tenant and role in ('ceo','superadmin') order by role limit 1;
    insert into public.leads (tenant_id, contact_name, phone, email, service_requested, lead_source, temperature, status,
      notes, custom_fields, campaign_page_id, attribution, created_by, attended_by)
    values (_tenant, _name, _phone, _email, nullif(_page.name,''), 'campaign', 'warm', 'new',
      _payload->>'message', coalesce(_payload->'custom_fields','[]'::jsonb), _page.id, _attr, _ceo, _ceo) returning id into _lead;
  end if;
  return jsonb_build_object('status','ok','lead_id',_lead);
end $function$;
grant execute on function public._campaign_create_lead(text, jsonb, text) to anon, authenticated;
