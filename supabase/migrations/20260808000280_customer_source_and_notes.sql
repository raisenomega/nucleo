-- Clientes · fix de source (lead vs landing_order) + tapar fuga de notes_for_team (Cliente 360 · rodaja 5)
-- El portal editaba notes_for_team (campo interno) vía cp_update_own. Se protege con RPCs whitelist + drop de la policy.

-- ============ 1. source: parametrizar el auto-resolver (lead vs orden web) ============
-- Se dropea la firma de 4 args para que la nueva (5º param con default) no genere un overload ambiguo.
drop function if exists public._resolve_customer_by_email(uuid, text, text, text);
create or replace function public._resolve_customer_by_email(_tenant uuid, _email text, _name text, _phone text, _source text default 'landing_order')
 returns uuid language plpgsql security definer set search_path to 'public' as $fn$
declare _norm text := lower(trim(_email)); _id uuid;
begin
  if _norm is null or _norm = '' then return null; end if;
  select id into _id from public.customer_profiles where tenant_id = _tenant and lower(trim(email)) = _norm limit 1;
  if _id is not null then return _id; end if;
  begin
    insert into public.customer_profiles (tenant_id, user_id, full_name, email, phone, source, is_active)
      values (_tenant, null, coalesce(nullif(trim(_name), ''), _norm), _email, nullif(trim(_phone), ''), _source, true)
      returning id into _id;
  exception when unique_violation then
    select id into _id from public.customer_profiles where tenant_id = _tenant and lower(trim(email)) = _norm limit 1;
  end;
  return _id;
end $fn$;

-- lead → cotización: el cliente creado se etiqueta 'lead' (antes heredaba 'landing_order' del resolver)
create or replace function public.generate_quote_from_lead(p_lead_id uuid)
 returns uuid language plpgsql security definer set search_path to 'public' as $fn$
declare _tenant uuid := current_tenant(); _lead public.leads%rowtype; _q uuid; _items jsonb; _sub numeric; _tax numeric; _tot numeric; _cid uuid;
begin
  if not public.can_access_module('quotes','create') then raise exception 'No autorizado'; end if;
  select * into _lead from leads where id = p_lead_id and tenant_id = _tenant;
  if not found then raise exception 'Lead no encontrado'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('description',description,'quantity',quantity,'unit_price',unit_price,
           'tax_pct',tax_pct,'discount_pct',discount_pct,'line_total',line_total) order by sort),'[]'::jsonb),
         coalesce(sum(quantity*unit_price*(1-discount_pct/100)),0), coalesce(sum(line_total),0)
    into _items, _sub, _tot from lead_items where lead_id = p_lead_id and tenant_id = _tenant;
  if _tot = 0 and coalesce(_lead.quoted_price,0) > 0 then
    _items := jsonb_build_array(jsonb_build_object('description',_lead.service_requested,'quantity',1,'unit_price',_lead.quoted_price,'tax_pct',0,'discount_pct',0,'line_total',_lead.quoted_price));
    _sub := _lead.quoted_price; _tot := _lead.quoted_price;
  end if;
  _tax := _tot - _sub;
  _cid := public._resolve_customer_by_email(_tenant, _lead.email, _lead.contact_name, _lead.phone, 'lead');  -- lead sin email → NULL, OK
  insert into quotes(tenant_id, client_name, client_phone, client_email, client_address, customer_id, items, subtotal, tax_total, total, status, valid_until, linked_lead_id, created_by)
    values(_tenant, _lead.contact_name, _lead.phone, _lead.email, _lead.address, _cid, _items, _sub, _tax, _tot, 'draft', current_date + 15, p_lead_id, auth.uid())
    returning id into _q;
  return _q;
end $fn$;

-- ============ 2. backfill de source NULL (datos legacy) + CHECK de valores válidos ============
update public.customer_profiles set source='portal' where source is null and user_id is not null;
update public.customer_profiles set source='manual' where source is null and user_id is null;
-- reemplaza el CHECK existente (portal/manual/import/landing_order) para admitir 'lead'
alter table public.customer_profiles drop constraint if exists customer_profiles_source_check;
alter table public.customer_profiles add constraint customer_profiles_source_check check (source in ('manual','portal','landing_order','lead','import'));

-- ============ 3. Fuga notes_for_team: el portal solo actualiza vía RPC whitelist; se quita el update directo ============
create or replace function public.update_my_customer(_payload jsonb)
 returns void language plpgsql security definer set search_path to 'public' as $fn$
declare _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'No autenticado'; end if;
  update public.customer_profiles set
    full_name          = coalesce(_payload->>'full_name', full_name),
    phone              = coalesce(_payload->>'phone', phone),
    address            = coalesce(_payload->>'address', address),
    city               = coalesce(_payload->>'city', city),
    state              = coalesce(_payload->>'state', state),
    zip_code           = coalesce(_payload->>'zip_code', zip_code),
    photo_url          = coalesce(_payload->>'photo_url', photo_url),
    contact_preference = coalesce(_payload->>'contact_preference', contact_preference),
    language           = coalesce(_payload->>'language', language),
    notification_pref  = coalesce(_payload->>'notification_pref', notification_pref),
    updated_at = now()
  where user_id = _uid;  -- campos internos (notes_for_team, credit_limit, segment_id, discount_pct, on_hold…) NO se tocan
end $fn$;
grant execute on function public.update_my_customer(jsonb) to authenticated;

create or replace function public.deactivate_my_account()
 returns void language plpgsql security definer set search_path to 'public' as $fn$
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  update public.customer_profiles set is_active = false, updated_at = now() where user_id = auth.uid();
end $fn$;
grant execute on function public.deactivate_my_account() to authenticated;

-- Quita el update directo del cliente: ahora solo puede mutar vía los RPCs whitelist de arriba.
drop policy if exists cp_update_own on public.customer_profiles;
