-- Migración 162: leads.custom_fields (para mostrar los detalles estructurados de solicitudes de página de servicio).
-- El form request ya resuelve los labels (locale) → guarda [{label,value}] legible. notes = resumen plano derivado.
-- Otras sources (web-landing/order-web) no lo escriben → default '[]' → el bloque no renderiza. Cero regresión.
alter table public.leads add column if not exists custom_fields jsonb not null default '[]'::jsonb;

create or replace function public._public_create_service_request(_hostname text, _slug text, _payload jsonb, _client_ip text default 'unknown')
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $fn$
declare _t uuid; _ceo uuid; _name text; _email text; _hits int; _lead uuid; _cf jsonb; _notes text;
begin
  _t := public._landing_resolve_tenant(_hostname);
  if _t is null then return jsonb_build_object('status','error','code','origin_not_allowed'); end if;
  _name := btrim(concat_ws(' ', _payload->>'firstName', _payload->>'lastName'));
  _email := lower(btrim(coalesce(_payload->>'email','')));
  if _name='' or _email='' or coalesce(_payload->>'phone','')='' or coalesce(_payload->>'serviceType','')='' then
    return jsonb_build_object('status','error','code','invalid_payload'); end if;
  _hits := public._public_rate_hit(encode(extensions.digest(_hostname||'|'||_email||'|'||coalesce(nullif(_client_ip,''),'unknown'),'sha256'),'hex'));
  if _hits > 5 then return jsonb_build_object('status','error','code','rate_limited'); end if;
  select user_id into _ceo from public.user_roles where tenant_id=_t and role in ('ceo','superadmin') order by role limit 1;
  _cf := case when jsonb_typeof(_payload->'custom_fields')='array' then _payload->'custom_fields' else '[]'::jsonb end;
  _notes := 'Solicitud '||_slug || coalesce(E'\n' || (select string_agg((c->>'label')||': '||(c->>'value'), E'\n') from jsonb_array_elements(_cf) c), '');
  insert into public.leads (tenant_id, contact_name, phone, email, service_requested, lead_source, temperature, status, notes, custom_fields, created_by, attended_by)
    values (_t, _name, _payload->>'phone', _email, coalesce(nullif(_payload->>'serviceTypeLabel',''), _payload->>'serviceType'), _slug||'-request', 'warm', 'Nuevo', _notes, _cf, _ceo, _ceo)
    returning id into _lead;
  return jsonb_build_object('status','ok','lead_id',_lead);
end $fn$;
grant execute on function public._public_create_service_request(text, text, jsonb, text) to anon, authenticated;
