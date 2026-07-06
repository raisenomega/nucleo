-- 20260706000048_expense_classes_helper.sql
-- Sub-slice C: agrupa los expenses del mes por expense_class (fixed/variable/debt/one_time).
-- Alimenta el break-even correcto (solo fijos) en get_reconciliation_snapshot v4 (00049).

create or replace function public.expense_classes_for(tid uuid, m0 date, m1 date)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'fixed', coalesce(sum(e.amount) filter (where c.expense_class='fixed'),0),
    'variable', coalesce(sum(e.amount) filter (where c.expense_class='variable'),0),
    'debt', coalesce(sum(e.amount) filter (where c.expense_class='debt'),0),
    'one_time', coalesce(sum(e.amount) filter (where c.expense_class='one_time'),0),
    'unclassified', coalesce(sum(e.amount) filter (where c.expense_class is null),0)
  )
  from public.expenses e
  left join public.categories c on c.id = e.category_id
  where e.tenant_id = tid and e.expense_date >= m0 and e.expense_date < m1 and e.deleted_at is null;
$$;
grant execute on function public.expense_classes_for(uuid, date, date) to authenticated;
