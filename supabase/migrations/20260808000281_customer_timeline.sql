-- Cliente 360 · Timeline de actividad unificado (rodaja 9). UNION ALL de eventos de los módulos, orden cronológico.
-- Nota columnas reales: tenant_landing_orders/route_stops/customer_reviews sin created_by; invoices/quotes sin deleted_at.
create or replace function public.get_customer_timeline(p_customer_id uuid, p_limit integer default 50, p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $fn$
declare _t uuid := current_tenant(); _res jsonb;
begin
  if not public.can_access_module('customers','view') then raise exception 'NOT_AUTHORIZED'; end if;
  if not exists (select 1 from public.customer_profiles where id = p_customer_id and tenant_id = _t) then raise exception 'CUSTOMER_NOT_FOUND'; end if;
  with ev as (
    select created_at as ed, 'invoice_created' as et, 'Factura '||coalesce(invoice_number,'—')||' creada' as ti,
      '$'||to_char(coalesce(total,0),'FM999999990.00')||' · '||status as su, 'invoice' as ent, id as eid, created_by as aid
    from public.invoices where customer_id = p_customer_id
    union all
    select ip.created_at, 'payment_received', 'Pago — Factura '||coalesce(i.invoice_number,'—'),
      '$'||to_char(coalesce(ip.amount,0),'FM999999990.00'), 'invoice', i.id, ip.created_by
    from public.invoice_payments ip join public.invoices i on i.id = ip.invoice_id where i.customer_id = p_customer_id
    union all
    select created_at, 'quote_'||status, 'Cotización '||coalesce(quote_number,'—')||' · '||status,
      '$'||to_char(coalesce(total,0),'FM999999990.00'), 'quote', id, created_by
    from public.quotes where customer_id = p_customer_id
    union all
    select created_at, 'order_'||status, 'Orden '||coalesce(order_number, left(id::text,8)),
      '$'||to_char(coalesce(total,0),'FM999999990.00'), 'order', id, null::uuid
    from public.tenant_landing_orders where customer_id = p_customer_id
    union all
    select completed_at, 'service_completed', 'Servicio completado',
      coalesce(service_type,'')||case when address is not null then ' · '||address else '' end, 'route_stop', id, null::uuid
    from public.route_stops where customer_id = p_customer_id and completed_at is not null and deleted_at is null
    union all
    select created_at, 'lead_'||status, 'Lead: '||coalesce(nullif(service_requested,''), contact_name, '—'), status, 'lead', id, created_by
    from public.leads where customer_id = p_customer_id and deleted_at is null
    union all
    select created_at, 'review_received', 'Evaluación recibida',
      rating::text||'/5'||case when comment is not null then ' — '||comment else '' end, 'review', id, null::uuid
    from public.customer_reviews where customer_profile_id = p_customer_id
    union all
    select created_at, 'customer_created', 'Cuenta creada', coalesce(source,'manual'), 'customer', id, null::uuid
    from public.customer_profiles where id = p_customer_id
  ), page as (select * from ev order by ed desc nulls last limit p_limit offset p_offset)
  select coalesce(jsonb_agg(jsonb_build_object(
    'eventDate', page.ed, 'eventType', page.et, 'title', page.ti, 'subtitle', page.su,
    'entityType', page.ent, 'entityId', page.eid, 'actorName', p.full_name) order by page.ed desc), '[]'::jsonb)
  into _res from page left join public.profiles p on p.id = page.aid;
  return _res;
end $fn$;
grant execute on function public.get_customer_timeline(uuid, integer, integer) to authenticated;
