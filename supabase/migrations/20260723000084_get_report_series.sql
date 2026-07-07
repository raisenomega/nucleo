-- 20260723000084_get_report_series.sql  (spec del owner: "migración 00078" -> renumerada al hueco 84)
-- REPORTES (/reports): serie mensual + cortes agregados en UNA llamada -> evita N RPC x M meses.
-- get_report_series es SECURITY DEFINER + guard (income|expenses view). Los helpers reciben el tid ya
-- resuelto por el caller guardado (NO tienen grant ni son definer) -> no se pueden invocar sueltos.
-- Incluye can_access_module reconociendo el módulo 'reports' (operaciones=view; ceo/coo por catch-all).

create or replace function public.can_access_module(p_module text, p_perm text default 'view')
returns boolean language plpgsql stable security definer set search_path = public as $$
declare _role text; _access jsonb;
begin
  _role := current_setting('request.jwt.claims', true)::jsonb->>'user_role';
  select ed.module_access into _access from public.employee_details ed
    join public.profiles p on p.id = ed.profile_id
    where p.id = auth.uid() and ed.tenant_id = current_tenant();
  if _access is not null and _access->p_module is not null then
    return coalesce((_access->p_module->>p_perm)::boolean, false);
  end if;
  if _role in ('superadmin', 'ceo') then return true; end if;
  if _role = 'coo' then
    if p_module = 'settings' and p_perm not in ('view', 'categories') then return false; end if;
    return true;
  end if;
  if _role = 'operaciones' then
    if p_module = 'dashboard' and p_perm = 'view' then return true; end if;
    if p_module = 'inventory' and p_perm in ('view', 'edit') then return true; end if;
    if p_module = 'expenses' and p_perm in ('view', 'create') then return true; end if;
    if p_module = 'leads' and p_perm = 'view' then return true; end if;
    if p_module = 'accounts_receivable' and p_perm = 'view' then return true; end if;
    if p_module = 'reports' and p_perm = 'view' then return true; end if;
    if p_module = 'routes' then return true; end if;
    return false;
  end if;
  if _role = 'servicio' then
    if p_module = 'dashboard' and p_perm = 'view' then return true; end if;
    if p_module = 'inventory' and p_perm = 'view' then return true; end if;
    if p_module = 'routes' and p_perm in ('view', 'create', 'edit') then return true; end if;
    return false;
  end if;
  return false;
end;
$$;

-- Helper 1: serie mensual. Recibe tid del caller guardado. Sin grant, sin definer (interno).
create or replace function public.report_series_months(_tid uuid, _from date, _to date)
returns jsonb language sql stable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'month', to_char(m,'YYYY-MM'), 'income', inc, 'expense', exp, 'payroll', pay, 'extraordinary', ext,
    'marketing_spent', msp, 'marketing_budget', mbg,
    'leads_new', lnew, 'leads_converted', lconv, 'leads_quoted', lq,
    'routes_completed', rc, 'routes_not_attended', rna, 'balance', inc-exp-pay-ext,
    'margin_pct', case when inc>0 then round(100.0*(inc-exp-pay-ext)/inc,1) else 0 end) order by m),'[]'::jsonb)
  from (
    select m,
      coalesce((select sum(amount) from income where tenant_id=_tid and income_date>=m and income_date<m+interval '1 month' and deleted_at is null),0) inc,
      coalesce((select sum(amount) from expenses where tenant_id=_tid and expense_date>=m and expense_date<m+interval '1 month' and deleted_at is null),0) exp,
      coalesce((select sum(coalesce(nullif(total_employer_cost,0),amount)) from payroll where tenant_id=_tid and pay_date>=m and pay_date<m+interval '1 month' and deleted_at is null),0) pay,
      coalesce((select sum(amount) from extraordinary_payments where tenant_id=_tid and payment_date>=m and payment_date<m+interval '1 month' and deleted_at is null),0) ext,
      coalesce((select sum(amount) from marketing_expenses where tenant_id=_tid and expense_date>=m and expense_date<m+interval '1 month' and deleted_at is null),0) msp,
      coalesce((select sum(budgeted_amount) from marketing_budgets where tenant_id=_tid and month>=m and month<m+interval '1 month'),0) mbg,
      coalesce((select count(*) from leads where tenant_id=_tid and created_at::date>=m and created_at::date<m+interval '1 month' and deleted_at is null),0) lnew,
      coalesce((select count(*) from leads where tenant_id=_tid and status='converted' and created_at::date>=m and created_at::date<m+interval '1 month' and deleted_at is null),0) lconv,
      coalesce((select sum(quoted_price) from leads where tenant_id=_tid and created_at::date>=m and created_at::date<m+interval '1 month' and deleted_at is null),0) lq,
      coalesce((select count(*) from route_stops s join service_routes r on r.id=s.route_id where r.tenant_id=_tid and r.route_date>=m and r.route_date<m+interval '1 month' and s.status='Completada'),0) rc,
      coalesce((select count(*) from route_stops s join service_routes r on r.id=s.route_id where r.tenant_id=_tid and r.route_date>=m and r.route_date<m+interval '1 month' and s.status='No atendido'),0) rna
    from generate_series(date_trunc('month',_from), date_trunc('month',_to), interval '1 month') m
  ) s;
$$;

-- Helper 2: cortes agregados del periodo. Recibe tid del caller guardado. Sin grant, sin definer.
create or replace function public.report_series_cuts(_tid uuid, _from date, _to date)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'top_clients', (select coalesce(jsonb_agg(jsonb_build_object('name',name,'total',total,'count',cnt) order by total desc),'[]'::jsonb) from (
      select coalesce(nullif(trim(client_reference),''),'—') name, sum(amount) total, count(*) cnt from income
      where tenant_id=_tid and income_date between _from and _to and deleted_at is null group by 1 order by total desc limit 10) s),
    'top_employees', (select coalesce(jsonb_agg(jsonb_build_object('name',full_name,'stops_completed',c,'stops_not_attended',na,'collected',col) order by col desc),'[]'::jsonb) from (
      select p.full_name,
        (select count(*) from route_stops s join service_routes r on r.id=s.route_id where r.assigned_to=p.id and r.tenant_id=_tid and r.route_date between _from and _to and s.status='Completada') c,
        (select count(*) from route_stops s join service_routes r on r.id=s.route_id where r.assigned_to=p.id and r.tenant_id=_tid and r.route_date between _from and _to and s.status='No atendido') na,
        (select coalesce(sum(s.actual_amount),0) from route_stops s join service_routes r on r.id=s.route_id where r.assigned_to=p.id and r.tenant_id=_tid and r.route_date between _from and _to and s.linked_income_id is not null) col
      from profiles p where p.tenant_id=_tid) s where c+na>0 or col>0),
    'expenses_by_category', (select coalesce(jsonb_agg(jsonb_build_object('category',label,'class',expense_class,'total',total) order by total desc),'[]'::jsonb) from (
      select c.label, c.expense_class, sum(e.amount) total from expenses e join categories c on c.id=e.category_id
      where e.tenant_id=_tid and e.expense_date between _from and _to and e.deleted_at is null group by c.label,c.expense_class) s),
    'income_by_category', (select coalesce(jsonb_agg(jsonb_build_object('category',label,'total',total) order by total desc),'[]'::jsonb) from (
      select c.label, sum(i.amount) total from income i join categories c on c.id=i.category_id
      where i.tenant_id=_tid and i.income_date between _from and _to and i.deleted_at is null group by c.label) s),
    'leads_by_source', (select coalesce(jsonb_agg(jsonb_build_object('source',source,'count',cnt,'converted',conv,'cac',cac) order by cnt desc),'[]'::jsonb) from (
      select coalesce(l.lead_source,'—') source, count(*) cnt, count(*) filter (where l.status='converted') conv,
        round(coalesce((select sum(amount) from marketing_expenses me where me.tenant_id=_tid and me.channel=l.lead_source and me.expense_date between _from and _to and me.deleted_at is null),0)
              / nullif(count(*) filter (where l.status='converted'),0), 2) cac
      from leads l where l.tenant_id=_tid and l.created_at::date between _from and _to and l.deleted_at is null group by l.lead_source) s),
    'leads_by_status', (select coalesce(jsonb_agg(jsonb_build_object('status',status,'count',cnt)),'[]'::jsonb) from (
      select status, count(*) cnt from leads where tenant_id=_tid and created_at::date between _from and _to and deleted_at is null group by status) s),
    'payroll_by_employee', (select coalesce(jsonb_agg(jsonb_build_object('name',full_name,'gross',gross,'net',net,'employer_cost',ec) order by ec desc),'[]'::jsonb) from (
      select coalesce(pr.full_name,'—') full_name, sum(pay.gross_salary) gross, sum(pay.net_salary) net, sum(coalesce(nullif(pay.total_employer_cost,0),pay.amount)) ec
      from payroll pay left join profiles pr on pr.id=pay.employee_id
      where pay.tenant_id=_tid and pay.pay_date between _from and _to and pay.deleted_at is null group by pr.full_name) s),
    'marketing_by_channel', (select coalesce(jsonb_agg(jsonb_build_object('channel',ch,'budget',budget,'spent',spent,'leads',lds,'converted',conv,'revenue',rev) order by spent desc),'[]'::jsonb) from (
      select ch,
        coalesce((select sum(budgeted_amount) from marketing_budgets mb where mb.tenant_id=_tid and mb.channel=ch and mb.month between date_trunc('month',_from) and _to),0) budget,
        coalesce((select sum(amount) from marketing_expenses me where me.tenant_id=_tid and me.channel=ch and me.expense_date between _from and _to and me.deleted_at is null),0) spent,
        coalesce((select count(*) from leads l where l.tenant_id=_tid and l.lead_source=ch and l.created_at::date between _from and _to and l.deleted_at is null),0) lds,
        coalesce((select count(*) from leads l where l.tenant_id=_tid and l.lead_source=ch and l.status='converted' and l.created_at::date between _from and _to and l.deleted_at is null),0) conv,
        coalesce((select sum(quoted_price) from leads l where l.tenant_id=_tid and l.lead_source=ch and l.status='converted' and l.created_at::date between _from and _to and l.deleted_at is null),0) rev
      from (select distinct channel ch from marketing_expenses where tenant_id=_tid and channel is not null
            union select distinct lead_source from leads where tenant_id=_tid and lead_source is not null
            union select distinct channel from marketing_budgets where tenant_id=_tid and channel is not null) chans) s)
  );
$$;

-- Fachada guardada: resuelve el tid y compone months + cuts. Único con grant a authenticated.
create or replace function public.get_report_series(p_from date, p_to date)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.can_access_module('income','view') or public.can_access_module('expenses','view')
    then jsonb_build_object('months', public.report_series_months(public.current_tenant(), p_from, p_to))
         || public.report_series_cuts(public.current_tenant(), p_from, p_to)
    else jsonb_build_object('months', '[]'::jsonb) end;
$$;
grant execute on function public.get_report_series(date, date) to authenticated;
