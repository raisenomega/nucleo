-- GPS-3 A1 · Postear depreciación al GL correctamente. Hallazgo: _post_depreciation_for llenaba
-- asset_depreciation_entries (ledger subsidiario) pero NUNCA posteaba al GL (linked_expense_id siempre null).
-- Contablemente la depreciación es Dr 6700 Depreciación / Cr 1230 Depreciación Acumulada (contra-activo) —
-- NO Cr 1119 Efectivo (no es salida de cash). Se cablea vía _gl_post (no-op si el tenant no tiene gl_enabled).
-- Idempotente: solo postea GL cuando la entry es NUEVA (on conflict do nothing → found). El backfill histórico
-- ya se corrió con la versión anterior (sin GL) → no inunda el GL con asientos retroactivos; esto rige de aquí en adelante.
-- source_type 'depreciation' no estaba permitido en journal_entries → se añade al CHECK.
alter table public.journal_entries drop constraint if exists journal_entries_source_type_check;
alter table public.journal_entries add constraint journal_entries_source_type_check
  check (source_type = any (array['expense','income','invoice','invoice_payment','payroll','inventory','bank','adjustment','closing','opening','vendor_bill','bill_payment','depreciation']));

create or replace function public._post_depreciation_for(_tenant uuid, _year integer, _month integer, _asset_id uuid default null)
 returns integer language plpgsql security definer set search_path to 'public' as $function$
declare _a public.tenant_assets; _monthly numeric; _accum numeric; _book numeric; _amount numeric; _posted int := 0;
  _ps date := make_date(_year, _month, 1); _eid uuid;
  _actor uuid := coalesce(auth.uid(), (select id from public.profiles where tenant_id = _tenant order by created_at limit 1));
begin
  for _a in select * from public.tenant_assets where tenant_id=_tenant and depreciation_method='straight_line'
    and status not in ('sold','retired','lost') and purchase_date is not null and purchase_date <= _ps
    and (_asset_id is null or id=_asset_id) loop
    _monthly := public._monthly_depreciation(_a);
    if _monthly <= 0 then continue; end if;
    select coalesce(sum(amount),0) into _accum from public.asset_depreciation_entries where asset_id=_a.id;
    _book := _a.purchase_price - _accum;
    _amount := least(_monthly, greatest(0, _book - coalesce(_a.salvage_value,0)));
    if _amount <= 0 then continue; end if;   -- totalmente depreciado
    insert into public.asset_depreciation_entries (tenant_id, asset_id, period_year, period_month, amount, book_value_after)
    values (_tenant, _a.id, _year, _month, _amount, _book - _amount)
    on conflict (asset_id, period_year, period_month) do nothing
    returning id into _eid;
    if found then
      _posted := _posted + 1;
      perform public._gl_post(_tenant, _ps, 'Depreciación '||_a.name||' '||to_char(_ps,'YYYY-MM'),
        'depreciation', _eid, jsonb_build_array(
          jsonb_build_object('account_code','6700','debit',_amount,'credit',0,'description','Depreciación '||_a.name),
          jsonb_build_object('account_code','1230','debit',0,'credit',_amount,'description','Depreciación acumulada')
        ), _actor);
    end if;
  end loop;
  return _posted;
end $function$;
