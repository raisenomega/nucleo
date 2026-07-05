-- 20260705000032_marketing_snapshot.sql
-- Dashboard/KPIs Marketing: presupuesto vs gasto + atribución de leads (CAC/ROI). Tenant-scoped.
-- "Leads de marketing" = leads cuyo lead_source mapea a un canal (channel_for_source no null).

create or replace function public.get_marketing_snapshot(p_month date default current_date)
returns jsonb language sql stable security definer set search_path = public as $$
  with t as (
    select public.current_tenant() as tid, date_trunc('month', p_month)::date as m0,
           (date_trunc('month', p_month) + interval '1 month')::date as m1
  ),
  b as (select coalesce(sum(budgeted_amount), 0) tot from public.marketing_budgets mb, t
    where mb.tenant_id = t.tid and mb.month >= t.m0 and mb.month < t.m1),
  e as (select coalesce(sum(amount), 0) tot from public.marketing_expenses me, t
    where me.tenant_id = t.tid and me.expense_date >= t.m0 and me.expense_date < t.m1 and me.deleted_at is null),
  ml as (
    select ld.status, ld.quoted_price
    from t
    join public.leads ld on ld.tenant_id = t.tid
      and ld.call_date >= t.m0 and ld.call_date < t.m1 and ld.deleted_at is null
    join public.categories c on c.id = ld.lead_source_id
    where public.channel_for_source(c.label) is not null
  )
  select jsonb_build_object(
    'total_budget', (select tot from b),
    'total_spent', (select tot from e),
    'executed_pct', case when (select tot from b) > 0
      then round((select tot from e) * 100 / (select tot from b), 1) else 0 end,
    'leads_generated', (select count(*) from ml),
    'converted', (select count(*) from ml where status = 'converted'),
    'cac', case when (select count(*) from ml where status = 'converted') > 0
      then round((select tot from e) / (select count(*) from ml where status = 'converted'), 2) else 0 end,
    'roi', case when (select tot from e) > 0
      then round((select coalesce(sum(quoted_price), 0) from ml where status = 'converted') * 100 / (select tot from e), 1) else 0 end
  );
$$;

grant execute on function public.get_marketing_snapshot(date) to authenticated;
