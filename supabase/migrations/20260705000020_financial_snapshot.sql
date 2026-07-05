-- 20260705000020_financial_snapshot.sql
-- Dashboard v1: snapshot financiero del mes, tenant-scoped. Solo income + expenses (lo que existe).
-- SECURITY DEFINER + filtro explícito por current_tenant() (lee el JWT aunque corra como owner).

create or replace function public.get_financial_snapshot(p_month date default current_date)
returns jsonb language sql stable security definer set search_path = public as $$
  with t as (
    select public.current_tenant() as tid,
           date_trunc('month', p_month)::date as m0,
           (date_trunc('month', p_month) + interval '1 month')::date as m1
  ),
  inc as (
    select i.amount, i.income_date as d, c.label
    from t
    join public.income i on i.tenant_id = t.tid
      and i.income_date >= t.m0 and i.income_date < t.m1 and i.deleted_at is null
    left join public.categories c on c.id = i.category_id
  ),
  exp as (
    select e.amount, e.expense_date as d, c.label
    from t
    join public.expenses e on e.tenant_id = t.tid
      and e.expense_date >= t.m0 and e.expense_date < t.m1 and e.deleted_at is null
    left join public.categories c on c.id = e.category_id
  )
  select jsonb_build_object(
    'total_income', coalesce((select sum(amount) from inc), 0),
    'total_expenses', coalesce((select sum(amount) from exp), 0),
    'balance', coalesce((select sum(amount) from inc), 0) - coalesce((select sum(amount) from exp), 0),
    'income_count', (select count(*) from inc),
    'expense_count', (select count(*) from exp),
    'top_income_category', (select label from inc group by label order by sum(amount) desc nulls last limit 1),
    'top_expense_category', (select label from exp group by label order by sum(amount) desc nulls last limit 1),
    'recent_income', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('date', d, 'category', label, 'amount', amount) x
        from inc order by d desc limit 5) s), '[]'::jsonb),
    'recent_expenses', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('date', d, 'category', label, 'amount', amount) x
        from exp order by d desc limit 5) s), '[]'::jsonb)
  );
$$;

grant execute on function public.get_financial_snapshot(date) to authenticated;
