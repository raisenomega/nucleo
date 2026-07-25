-- GL · Estado de Resultados (P&L GAAP) desde el libro mayor (Ola 3 · Sesión C8)
-- Cierra el gap #1 de la auditoría: Utilidad Bruta real (Ingresos − COGS). current_tenant() (no tenant
-- arbitrario, evita fuga entre tenants por el SECURITY DEFINER). Gated por accounting.view + .cost.
create or replace function public.get_income_statement(p_year int, p_month_from int default 1, p_month_to int default 12)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _r jsonb;
begin
  if not (public.can_access_module('accounting','view') and public.can_access_module('accounting','cost')) then
    return jsonb_build_object('error','forbidden');
  end if;
  with pl as (
    select a.account_type, a.account_code, a.account_name,
      round(case when a.account_type='revenue' then sum(l.credit)-sum(l.debit) else sum(l.debit)-sum(l.credit) end, 2) as amount
    from public.journal_entry_lines l
    join public.journal_entries e on e.id=l.entry_id
    join public.chart_of_accounts a on a.id=l.account_id
    where e.tenant_id=_t and e.status='posted' and not e.is_closing_entry
      and e.period_year=p_year and e.period_month between p_month_from and p_month_to
      and a.account_type in ('revenue','cogs','expense')
    group by a.account_type, a.account_code, a.account_name
    having sum(l.debit)<>0 or sum(l.credit)<>0
  ),
  sect as (
    select case when account_type in ('revenue','cogs') then account_type
                when account_code like '7%' then 'nonop' else 'opex' end as grp,
      jsonb_agg(jsonb_build_object('code',account_code,'name',account_name,'amount',amount) order by account_code) accounts,
      sum(amount) total
    from pl group by 1
  ),
  tot as (select
    coalesce((select total from sect where grp='revenue'),0) r, coalesce((select total from sect where grp='cogs'),0) c,
    coalesce((select total from sect where grp='opex'),0) o, coalesce((select total from sect where grp='nonop'),0) n)
  select jsonb_build_object(
    'period', jsonb_build_object('year',p_year,'monthFrom',p_month_from,'monthTo',p_month_to),
    'revenue', coalesce((select accounts from sect where grp='revenue'),'[]'::jsonb),
    'cogs', coalesce((select accounts from sect where grp='cogs'),'[]'::jsonb),
    'opex', coalesce((select accounts from sect where grp='opex'),'[]'::jsonb),
    'nonop', coalesce((select accounts from sect where grp='nonop'),'[]'::jsonb),
    'summary', jsonb_build_object(
      'totalRevenue', r, 'totalCogs', c, 'grossProfit', r-c,
      'grossMarginPct', case when r<>0 then round(100*(r-c)/r,1) else 0 end,
      'totalOpex', o, 'operatingIncome', r-c-o,
      'operatingMarginPct', case when r<>0 then round(100*(r-c-o)/r,1) else 0 end,
      'totalNonOp', n, 'netIncome', r-c-o-n,
      'netMarginPct', case when r<>0 then round(100*(r-c-o-n)/r,1) else 0 end))
  into _r from tot;
  return _r;
end $function$;
grant execute on function public.get_income_statement(int, int, int) to authenticated;
