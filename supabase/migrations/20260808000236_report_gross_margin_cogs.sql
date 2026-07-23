-- 236 · Ola 2.2c · Margen bruto: campo `cogs` por mes en report_series_months.
--
-- Métrica SEPARADA del margen operativo (que NO se toca): el operativo resta el gasto 'Inventario' (compra, base
-- caja); el bruto resta el COGS (costo de lo vendido/consumido, base devengado). Mostrar ambos por separado evita
-- el doble conteo (ningún número resta a la vez el gasto de compra Y el COGS). COGS = venta_publica (venta de
-- producto) + salida (consumo de insumos de ruta = costo de entregar el servicio), no borrados. Excluye
-- merma/ajuste/transferencia/entrada/devolucion. Solo se AGREGA `cogs` a la serie; el resto queda idéntico.

create or replace function public.report_series_months(_tid uuid, _from date, _to date)
 returns jsonb language sql stable set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'month', to_char(m,'YYYY-MM'), 'income', inc, 'expense', exp, 'payroll', pay, 'extraordinary', ext,
    'cogs', cogs, 'marketing_spent', msp, 'marketing_budget', mbg,
    'leads_new', lnew, 'leads_converted', lconv, 'leads_quoted', lq,
    'routes_completed', rc, 'routes_not_attended', rna, 'balance', inc-exp-pay-ext,
    'margin_pct', case when inc>0 then round(100.0*(inc-exp-pay-ext)/inc,1) else 0 end) order by m),'[]'::jsonb)
  from (
    select m,
      coalesce((select sum(amount) from income where tenant_id=_tid and income_date>=m and income_date<m+interval '1 month' and deleted_at is null),0) inc,
      coalesce((select sum(amount) from expenses where tenant_id=_tid and expense_date>=m and expense_date<m+interval '1 month' and deleted_at is null),0) exp,
      coalesce((select sum(coalesce(nullif(total_employer_cost,0),amount)) from payroll where tenant_id=_tid and pay_date>=m and pay_date<m+interval '1 month' and deleted_at is null),0) pay,
      coalesce((select sum(amount) from extraordinary_payments where tenant_id=_tid and payment_date>=m and payment_date<m+interval '1 month' and deleted_at is null),0) ext,
      coalesce((select sum(quantity*coalesce(unit_cost,0)) from inventory_movements where tenant_id=_tid and movement_type in ('venta_publica','salida') and deleted_at is null and movement_date>=m and movement_date<m+interval '1 month'),0) cogs,
      coalesce((select sum(amount) from marketing_expenses where tenant_id=_tid and expense_date>=m and expense_date<m+interval '1 month' and deleted_at is null),0) msp,
      coalesce((select sum(budgeted_amount) from marketing_budgets where tenant_id=_tid and month>=m and month<m+interval '1 month'),0) mbg,
      coalesce((select count(*) from leads where tenant_id=_tid and created_at::date>=m and created_at::date<m+interval '1 month' and deleted_at is null),0) lnew,
      coalesce((select count(*) from leads where tenant_id=_tid and status='converted' and created_at::date>=m and created_at::date<m+interval '1 month' and deleted_at is null),0) lconv,
      coalesce((select sum(quoted_price) from leads where tenant_id=_tid and created_at::date>=m and created_at::date<m+interval '1 month' and deleted_at is null),0) lq,
      coalesce((select count(*) from route_stops s join service_routes r on r.id=s.route_id where r.tenant_id=_tid and r.route_date>=m and r.route_date<m+interval '1 month' and s.status='Completada'),0) rc,
      coalesce((select count(*) from route_stops s join service_routes r on r.id=s.route_id where r.tenant_id=_tid and r.route_date>=m and r.route_date<m+interval '1 month' and s.status='No atendido'),0) rna
    from generate_series(date_trunc('month',_from), date_trunc('month',_to), interval '1 month') m
  ) s;
$function$;
