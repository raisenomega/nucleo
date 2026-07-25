-- GL · Balance General (Balance Sheet) desde el libro mayor (Ola 3 · Sesión C9)
-- Snapshot acumulado (todos los asientos posteados <= fecha de corte). Utilidad no cerrada = Σ(Cr-Dr)
-- de revenue/expense/cogs (revenue=+, gastos=−) → el balance SIEMPRE cuadra por la identidad del
-- trial balance (Activo = Pasivo + Capital + Utilidad). current_tenant(), gated view+cost.
create or replace function public.get_balance_sheet(p_as_of_date date default current_date)
returns jsonb language sql stable security definer set search_path to 'public' as $function$
  with bal as (
    select a.account_type at, a.account_code code, a.account_name name,
      round(case when a.account_type='asset' then sum(l.debit)-sum(l.credit) else sum(l.credit)-sum(l.debit) end,2) balance,
      round(sum(l.credit)-sum(l.debit),2) crdr
    from public.journal_entry_lines l
    join public.journal_entries e on e.id=l.entry_id
    join public.chart_of_accounts a on a.id=l.account_id
    where e.tenant_id=current_tenant() and e.status='posted' and e.entry_date <= p_as_of_date
    group by 1,2,3
  ),
  ni as (select coalesce(sum(crdr),0) net from bal where at in ('revenue','expense','cogs')),
  g as (
    select
      (select coalesce(jsonb_agg(jsonb_build_object('code',code,'name',name,'balance',balance) order by code),'[]'::jsonb) from bal where at='asset' and code like '11%' and balance<>0) ac,
      (select coalesce(sum(balance),0) from bal where at='asset' and code like '11%') act,
      (select coalesce(jsonb_agg(jsonb_build_object('code',code,'name',name,'balance',balance) order by code),'[]'::jsonb) from bal where at='asset' and code like '12%' and balance<>0) anc,
      (select coalesce(sum(balance),0) from bal where at='asset' and code like '12%') anct,
      (select coalesce(jsonb_agg(jsonb_build_object('code',code,'name',name,'balance',balance) order by code),'[]'::jsonb) from bal where at='liability' and code like '21%' and balance<>0) lc,
      (select coalesce(sum(balance),0) from bal where at='liability' and code like '21%') lct,
      (select coalesce(jsonb_agg(jsonb_build_object('code',code,'name',name,'balance',balance) order by code),'[]'::jsonb) from bal where at='liability' and code like '22%' and balance<>0) llt,
      (select coalesce(sum(balance),0) from bal where at='liability' and code like '22%') lltt,
      (select coalesce(jsonb_agg(jsonb_build_object('code',code,'name',name,'balance',balance) order by code),'[]'::jsonb) from bal where at='equity' and code<>'3200' and balance<>0) eqa,
      (select coalesce(sum(balance),0) from bal where at='equity' and code<>'3200') eqbal,
      (select net from ni) ni,
      (select account_name from public.chart_of_accounts where tenant_id=current_tenant() and account_code='3200') e3200
  )
  select case when public.can_access_module('accounting','view') and public.can_access_module('accounting','cost') then
    jsonb_build_object(
      'asOfDate', p_as_of_date,
      'assetsCurrent', ac, 'assetsCurrentTotal', act,
      'assetsNonCurrent', anc, 'assetsNonCurrentTotal', anct,
      'liabCurrent', lc, 'liabCurrentTotal', lct,
      'liabLongTerm', llt, 'liabLongTermTotal', lltt,
      'equity', eqa || jsonb_build_array(jsonb_build_object('code','3200','name',coalesce(e3200,'Utilidad del Período'),'balance',ni,'isComputed',true)),
      'equityTotal', eqbal + ni,
      'summary', jsonb_build_object(
        'totalAssets', act+anct, 'totalLiabilities', lct+lltt, 'totalEquity', eqbal+ni,
        'totalLiabilitiesEquity', lct+lltt+eqbal+ni,
        'isBalanced', abs((act+anct)-(lct+lltt+eqbal+ni)) < 0.01,
        'difference', round((act+anct)-(lct+lltt+eqbal+ni),2)))
    else jsonb_build_object('error','forbidden') end
  from g;
$function$;
grant execute on function public.get_balance_sheet(date) to authenticated;
