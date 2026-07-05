-- 20260705000028_crm_snapshot.sql
-- Dashboard CRM: snapshot de leads del mes, tenant-scoped (mismo patrón que get_financial_snapshot).
-- SECURITY DEFINER + filtro por current_tenant(). Cuenta por temperatura/status + conversión + recientes.

create or replace function public.get_crm_snapshot(p_month date default current_date)
returns jsonb language sql stable security definer set search_path = public as $$
  with t as (
    select public.current_tenant() as tid,
           date_trunc('month', p_month)::date as m0,
           (date_trunc('month', p_month) + interval '1 month')::date as m1
  ),
  l as (
    select ld.contact_name, ld.phone, ld.temperature, ld.status, ld.quoted_price, ld.call_date
    from t
    join public.leads ld on ld.tenant_id = t.tid
      and ld.call_date >= t.m0 and ld.call_date < t.m1 and ld.deleted_at is null
  )
  select jsonb_build_object(
    'total_leads', (select count(*) from l),
    'by_temperature', jsonb_build_object(
      'hot', (select count(*) from l where temperature = 'hot'),
      'warm', (select count(*) from l where temperature = 'warm'),
      'cold', (select count(*) from l where temperature = 'cold')),
    'by_status', jsonb_build_object(
      'new', (select count(*) from l where status = 'new'),
      'contacted', (select count(*) from l where status = 'contacted'),
      'quoted', (select count(*) from l where status = 'quoted'),
      'converted', (select count(*) from l where status = 'converted'),
      'lost', (select count(*) from l where status = 'lost')),
    'total_quoted', coalesce((select sum(quoted_price) from l), 0),
    'conversion_rate', case when (select count(*) from l) > 0
      then round((select count(*) from l where status = 'converted')::numeric * 100 / (select count(*) from l), 1)
      else 0 end,
    'recent_leads', coalesce((select jsonb_agg(x) from (
      select jsonb_build_object('contactName', contact_name, 'phone', phone, 'temperature', temperature,
        'status', status, 'quotedPrice', quoted_price, 'callDate', call_date) x
      from l order by call_date desc limit 5) s), '[]'::jsonb)
  );
$$;

grant execute on function public.get_crm_snapshot(date) to authenticated;
