-- 20260705000027_save_lead_with_items.sql
-- Leads v2: guardado atómico de un lead + sus items en una sola llamada (1 función = 1 transacción).
-- INSERT o UPDATE del lead (según lead->>'id') + reemplazo total de lead_items. tenant/created_by via defaults.

create or replace function public.save_lead_with_items(lead jsonb, items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  _id uuid := nullif(lead->>'id', '')::uuid;
  _tenant uuid := public.current_tenant();
begin
  if _id is null then
    insert into public.leads (contact_name, phone, email, address, city, zip_code,
      lead_source_id, service_type_id, temperature, status, call_date, notes, quoted_price, evidence_urls)
    values (lead->>'contact_name', lead->>'phone', nullif(lead->>'email',''), lead->>'address', lead->>'city',
      lead->>'zip_code', nullif(lead->>'lead_source_id','')::uuid, nullif(lead->>'service_type_id','')::uuid,
      lead->>'temperature', lead->>'status', (lead->>'call_date')::date, lead->>'notes',
      nullif(lead->>'quoted_price','')::numeric, coalesce(lead->'evidence_urls', '[]'::jsonb))
    returning id into _id;
  else
    update public.leads set
      contact_name = lead->>'contact_name', phone = lead->>'phone', email = nullif(lead->>'email',''),
      address = lead->>'address', city = lead->>'city', zip_code = lead->>'zip_code',
      lead_source_id = nullif(lead->>'lead_source_id','')::uuid, service_type_id = nullif(lead->>'service_type_id','')::uuid,
      temperature = lead->>'temperature', status = lead->>'status', call_date = (lead->>'call_date')::date,
      notes = lead->>'notes', quoted_price = nullif(lead->>'quoted_price','')::numeric,
      evidence_urls = coalesce(lead->'evidence_urls', '[]'::jsonb)
    where id = _id and tenant_id = _tenant;
  end if;

  delete from public.lead_items where lead_id = _id;
  insert into public.lead_items (lead_id, description, quantity, unit_price, tax_pct, discount_pct, sort)
  select _id, x->>'description', (x->>'quantity')::numeric, (x->>'unit_price')::numeric,
    coalesce((x->>'tax_pct')::numeric, 0), coalesce((x->>'discount_pct')::numeric, 0), (ord - 1)::int
  from jsonb_array_elements(coalesce(items, '[]'::jsonb)) with ordinality as t(x, ord);

  return jsonb_build_object('id', _id);
end; $$;

grant execute on function public.save_lead_with_items(jsonb, jsonb) to authenticated;
