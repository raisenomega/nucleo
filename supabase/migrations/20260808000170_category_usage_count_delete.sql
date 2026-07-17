-- categories-delete — permitir eliminar categorías sin uso (guard obligatorio: nunca borrar si tienen registros).
-- Una categoría puede referenciarse desde 14 columnas FK en 12 tablas (category_id / payment_method_id /
-- lead_source_id / service_type_id), así que el conteo las cubre todas. SECURITY DEFINER con guard de tenant
-- (solo cuenta si la categoría pertenece al tenant del JWT). El DELETE queda restringido a CEO/superadmin.

create or replace function public._count_category_usage(p_category_id uuid)
 returns integer language plpgsql stable security definer set search_path to 'public'
as $function$
declare _n int;
begin
  if not exists (select 1 from public.categories where id=p_category_id and tenant_id=public.current_tenant()) then return 0; end if;
  select
    (select count(*) from public.income where category_id=p_category_id or payment_method_id=p_category_id)
  + (select count(*) from public.expenses where category_id=p_category_id or payment_method_id=p_category_id)
  + (select count(*) from public.extraordinary_payments where category_id=p_category_id or payment_method_id=p_category_id)
  + (select count(*) from public.recurring_expenses where category_id=p_category_id)
  + (select count(*) from public.payroll where payment_method_id=p_category_id)
  + (select count(*) from public.invoices where payment_method_id=p_category_id)
  + (select count(*) from public.route_stops where payment_method_id=p_category_id)
  + (select count(*) from public.support_tickets where category_id=p_category_id)
  + (select count(*) from public.tax_obligation_rules where category_id=p_category_id)
  + (select count(*) from public.leads where lead_source_id=p_category_id or service_type_id=p_category_id)
  into _n;
  return _n;
end $function$;

grant execute on function public._count_category_usage(uuid) to authenticated;

create policy categories_delete_ceo on public.categories for delete
  using (tenant_id = public.current_tenant() and public.is_ceo_or_above());
