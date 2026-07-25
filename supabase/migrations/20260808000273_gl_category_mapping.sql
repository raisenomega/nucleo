-- GL · Mapeo categorías → cuentas (Ola 3 · Sesión C7)
-- Lectura para la UI + auto-asignación por heurístico + enganche en set_gl_enabled.
-- El set individual usa UPDATE directo (RLS categories_tenant_update). El posting ya usa
-- categories.account_id primero (via _category_to_account_code, C2).

-- Estado del mapeo de cada categoría gasto/ingreso (manual vs heurístico vs catch-all).
create or replace function public.get_category_mappings()
returns table(category_id uuid, kind text, label text, expense_class text, account_id uuid,
  account_code text, account_name text, resolved_code text, is_manual boolean, is_catchall boolean)
language plpgsql stable security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant();
begin
  if not public.can_access_module('accounting','view') then return; end if;
  return query
  select c.id, c.kind, c.label, c.expense_class, c.account_id, a.account_code, a.account_name,
    public._category_to_account_code(c.id),
    (c.account_id is not null),
    (public._category_to_account_code(c.id) in ('6900','4300'))
  from public.categories c
  left join public.chart_of_accounts a on a.id = c.account_id
  where c.tenant_id = _t and c.kind in ('expense','income') and c.active
  order by c.kind, c.label;
end $function$;
grant execute on function public.get_category_mappings() to authenticated;

-- Auto-asigna cuenta (por heurístico) a las categorías sin mapeo; salta las que caen en catch-all.
create or replace function public.auto_map_categories(p_tenant_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare _cat record; _code text; _acc uuid; _mapped int := 0; _remaining int := 0;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  for _cat in select id from public.categories
    where tenant_id = p_tenant_id and kind in ('expense','income') and active and account_id is null
  loop
    _code := public._category_to_account_code(_cat.id);
    if _code in ('6900','4300') then _remaining := _remaining + 1; continue; end if;
    select id into _acc from public.chart_of_accounts
      where tenant_id = p_tenant_id and account_code = _code and not is_header and active limit 1;
    if _acc is null then _remaining := _remaining + 1; continue; end if;
    update public.categories set account_id = _acc where id = _cat.id;
    _mapped := _mapped + 1;
  end loop;
  return jsonb_build_object('mapped', _mapped, 'remaining', _remaining);
end $function$;
grant execute on function public.auto_map_categories(uuid) to authenticated;

-- set_gl_enabled: al activar, tras seedear el COA, auto-mapea las categorías comunes.
create or replace function public.set_gl_enabled(p_enabled boolean)
returns boolean language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant();
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  if p_enabled then
    if not exists (select 1 from public.chart_of_accounts where tenant_id = _t) then
      perform public._seed_chart_of_accounts(_t);
    end if;
    perform public.auto_map_categories(_t);
  end if;
  update public.tenants set gl_enabled = p_enabled where id = _t;
  return p_enabled;
end $function$;
