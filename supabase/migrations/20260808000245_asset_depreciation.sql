-- =============================================
-- Ola 2.7a · Depreciación calculada (INFORMATIVA, sin gasto — el posteo contable llega con Ola 3)
-- book_value = purchase_price − Σ asientos. NO toca current_value (valor de mercado manual del owner).
-- Solo línea recta. Idempotente por UNIQUE (asset, año, mes). Tope en salvage. Excluye vendidos/retirados/perdidos.
-- =============================================

alter table public.tenant_assets add column if not exists salvage_value numeric(12,2) not null default 0;

create table public.asset_depreciation_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant(),
  asset_id uuid not null references public.tenant_assets(id) on delete cascade,
  period_year int not null,
  period_month int not null check (period_month between 1 and 12),
  amount numeric(12,2) not null,
  book_value_after numeric(12,2) not null,
  linked_expense_id uuid,              -- NULL por ahora (Ola 3 lo poblará)
  created_at timestamptz not null default now(),
  unique (asset_id, period_year, period_month)
);
create index idx_ade_asset on public.asset_depreciation_entries (asset_id, period_year, period_month);
alter table public.asset_depreciation_entries enable row level security;
create policy ade_select on public.asset_depreciation_entries for select using (tenant_id = current_tenant());
create policy ade_all on public.asset_depreciation_entries for all
  using (tenant_id = current_tenant() and can_access_module('assets','edit')) with check (tenant_id = current_tenant() and can_access_module('assets','edit'));

-- Depreciación mensual línea recta (0 si método != straight_line, años/precio inválidos).
create or replace function public._monthly_depreciation(_asset public.tenant_assets)
 returns numeric language sql immutable as $function$
  select case
    when _asset.depreciation_method <> 'straight_line' then 0
    when coalesce(_asset.depreciation_years,0) <= 0 then 0
    when coalesce(_asset.purchase_price,0) <= 0 then 0
    else round((_asset.purchase_price - coalesce(_asset.salvage_value,0)) / (_asset.depreciation_years * 12), 2)
  end;
$function$;

-- Core (sin gate): postea un período para un tenant (opcional 1 activo). Idempotente. Tope en salvage.
create or replace function public._post_depreciation_for(_tenant uuid, _year int, _month int, _asset_id uuid default null)
 returns int language plpgsql security definer set search_path to 'public' as $function$
declare _a public.tenant_assets; _monthly numeric; _accum numeric; _book numeric; _amount numeric; _posted int := 0; _ps date := make_date(_year, _month, 1);
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
    on conflict (asset_id, period_year, period_month) do nothing;
    if found then _posted := _posted + 1; end if;
  end loop;
  return _posted;
end $function$;

-- Postear un período (user, gateado, del tenant actual).
create or replace function public.post_asset_depreciation(_year int, _month int)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
begin
  if not public.can_access_module('assets','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  return jsonb_build_object('status','ok','posted', public._post_depreciation_for(public.current_tenant(), _year, _month), 'period', _year||'-'||_month);
end $function$;

-- Catch-up: postea mes a mes desde la compra hasta el mes anterior al actual (idempotente).
create or replace function public.backfill_asset_depreciation(_asset_id uuid default null)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _tenant uuid := current_tenant(); _m date; _end date := date_trunc('month', current_date)::date; _start date; _posted int := 0;
begin
  if not public.can_access_module('assets','edit') then raise exception 'NOT_AUTHORIZED'; end if;
  select min(date_trunc('month', purchase_date))::date into _start from public.tenant_assets
    where tenant_id=_tenant and depreciation_method='straight_line' and purchase_date is not null and (_asset_id is null or id=_asset_id);
  if _start is null then return jsonb_build_object('status','ok','posted',0); end if;
  _m := _start;
  while _m < _end loop
    _posted := _posted + public._post_depreciation_for(_tenant, extract(year from _m)::int, extract(month from _m)::int, _asset_id);
    _m := (_m + interval '1 month')::date;
  end loop;
  return jsonb_build_object('status','ok','posted',_posted);
end $function$;

-- Valores en libros por activo (para la card): precio, acumulada, book_value, valor de mercado, mensual, meses restantes.
create or replace function public.get_asset_book_values()
 returns jsonb language sql stable security definer set search_path to 'public' as $function$
  with t as (select case when public.can_access_module('assets','view') then public.current_tenant() else null end tid)
  select coalesce(jsonb_agg(jsonb_build_object(
    'asset_id', a.id, 'purchase_price', coalesce(a.purchase_price,0), 'salvage_value', a.salvage_value,
    'accumulated', coalesce(d.accum,0), 'book_value', coalesce(a.purchase_price,0) - coalesce(d.accum,0),
    'current_value', a.current_value, 'monthly', public._monthly_depreciation(a),
    'months_remaining', case when public._monthly_depreciation(a) > 0
      then greatest(0, floor((coalesce(a.purchase_price,0) - coalesce(d.accum,0) - coalesce(a.salvage_value,0)) / public._monthly_depreciation(a)))::int else 0 end)
    order by a.name), '[]'::jsonb)
  from public.tenant_assets a, t
  left join lateral (select sum(amount) accum from public.asset_depreciation_entries where asset_id=a.id) d on true
  where a.tenant_id = t.tid;
$function$;

grant execute on function public.post_asset_depreciation(int,int) to authenticated;
grant execute on function public.backfill_asset_depreciation(uuid) to authenticated;
grant execute on function public.get_asset_book_values() to authenticated;

-- Cron mensual (día 1, 02:00): postea el mes anterior para todos los tenants (sistema, sin gate).
create or replace function public.cron_post_asset_depreciation()
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid; _y int := extract(year from (current_date - interval '1 month'))::int; _m int := extract(month from (current_date - interval '1 month'))::int;
begin
  for _t in select distinct tenant_id from public.tenant_assets where depreciation_method='straight_line' loop
    perform public._post_depreciation_for(_t, _y, _m);
  end loop;
end $function$;
select cron.schedule('post-asset-depreciation-monthly', '0 2 1 * *', 'select public.cron_post_asset_depreciation()');
