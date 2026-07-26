-- GL · Estado de Flujo de Efectivo (método indirecto) — tercer estado financiero (Ola 3 · CF-1)
-- Reconciliación garantizada por la identidad: ΔCash(1119) = Σ(crédito−débito) de todas las cuentas no-1119.
-- Cada cuenta de balance se clasifica en una sección (exhaustivo). Depreciación se agrega vía 1230 (accum dep),
-- NO vía 6700 (evita doble conteo). Mermas ya quedan capturadas por 7200 (en utilidad) + baja de 1130 (capital
-- de trabajo). El asiento de apertura (source_type='opening') se trata como saldo inicial, no flujo del período.
create or replace function public.get_cash_flow_statement(
  p_year integer default extract(year from current_date)::int,
  p_month_from integer default 1,
  p_month_to integer default extract(month from current_date)::int
) returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _ni numeric; _cashb numeric; _cashe numeric; _net numeric;
  _adj jsonb; _wc jsonb; _inv jsonb; _fin jsonb; _adjt numeric; _wct numeric; _invt numeric; _fint numeric;
begin
  if not (public.can_access_module('accounting','view') and public.can_access_module('accounting','cost')) then raise exception 'NOT_AUTHORIZED'; end if;

  -- utilidad neta (nominal, período, excl cierre/apertura) — coincide con el P&L (C8)
  select coalesce(sum(l.credit - l.debit),0) into _ni
  from public.journal_entry_lines l join public.journal_entries e on e.id=l.entry_id join public.chart_of_accounts a on a.id=l.account_id
  where e.tenant_id=_t and e.status='posted' and not e.is_closing_entry and coalesce(e.source_type,'') <> 'opening'
    and e.period_year=p_year and e.period_month between p_month_from and p_month_to and a.account_type in ('revenue','expense','cogs');

  -- cambio por cuenta de balance (cr−dr) en el período, clasificado por sección
  with chg as (
    select a.account_name as name, a.account_code as code, a.account_type as typ, round(sum(l.credit - l.debit),2) as c,
      case when a.account_code='1230' then 'adj'
           when a.account_type='asset' and a.account_code like '12%' then 'inv'
           when a.account_type='asset' then 'wc'
           when a.account_type='liability' and a.account_code like '21%' then 'wc'
           else 'fin' end as sec
    from public.journal_entry_lines l join public.journal_entries e on e.id=l.entry_id join public.chart_of_accounts a on a.id=l.account_id
    where e.tenant_id=_t and e.status='posted' and not e.is_closing_entry and coalesce(e.source_type,'') <> 'opening'
      and e.period_year=p_year and e.period_month between p_month_from and p_month_to
      and a.account_type in ('asset','liability','equity') and a.account_code <> '1119'
    group by a.account_name, a.account_code, a.account_type having round(sum(l.credit - l.debit),2) <> 0
  )
  select
    coalesce(jsonb_agg(jsonb_build_object('label',name,'code',code,'amount',c) order by code) filter (where sec='adj'),'[]'::jsonb), coalesce(sum(c) filter (where sec='adj'),0),
    coalesce(jsonb_agg(jsonb_build_object('label',name,'code',code,'change',c,'description',
      case when typ='asset' and c<0 then '(Aumento)' when typ='asset' then 'Disminución' when c>0 then 'Aumento' else '(Disminución)' end) order by code) filter (where sec='wc'),'[]'::jsonb), coalesce(sum(c) filter (where sec='wc'),0),
    coalesce(jsonb_agg(jsonb_build_object('label',name,'code',code,'amount',c) order by code) filter (where sec='inv'),'[]'::jsonb), coalesce(sum(c) filter (where sec='inv'),0),
    coalesce(jsonb_agg(jsonb_build_object('label',name,'code',code,'amount',c) order by code) filter (where sec='fin'),'[]'::jsonb), coalesce(sum(c) filter (where sec='fin'),0)
  into _adj,_adjt,_wc,_wct,_inv,_invt,_fin,_fint from chg;

  -- efectivo inicial (1119 antes del período + la apertura) y final (1119 hasta el fin del período)
  select coalesce(sum(l.debit - l.credit),0) into _cashb
  from public.journal_entry_lines l join public.journal_entries e on e.id=l.entry_id join public.chart_of_accounts a on a.id=l.account_id
  where e.tenant_id=_t and e.status='posted' and a.account_code='1119'
    and (e.period_year < p_year or (e.period_year=p_year and e.period_month < p_month_from) or coalesce(e.source_type,'')='opening');
  select coalesce(sum(l.debit - l.credit),0) into _cashe
  from public.journal_entry_lines l join public.journal_entries e on e.id=l.entry_id join public.chart_of_accounts a on a.id=l.account_id
  where e.tenant_id=_t and e.status='posted' and a.account_code='1119'
    and (e.period_year < p_year or (e.period_year=p_year and e.period_month <= p_month_to));

  _net := round(_ni + _adjt + _wct + _invt + _fint, 2);
  return jsonb_build_object(
    'period', jsonb_build_object('year',p_year,'monthFrom',p_month_from,'monthTo',p_month_to),
    'operating', jsonb_build_object('netIncome',round(_ni,2),'adjustments',_adj,'workingCapital',_wc,'total',round(_ni+_adjt+_wct,2)),
    'investing', jsonb_build_object('items',_inv,'total',round(_invt,2)),
    'financing', jsonb_build_object('items',_fin,'total',round(_fint,2)),
    'summary', jsonb_build_object('netChange',_net,'cashBeginning',round(_cashb,2),'cashEnding',round(_cashe,2),'verification', abs(_cashb + _net - _cashe) < 0.01));
end $function$;
grant execute on function public.get_cash_flow_statement(integer,integer,integer) to authenticated;
