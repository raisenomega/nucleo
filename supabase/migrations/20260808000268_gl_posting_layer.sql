-- GL · Capa de POSTING (Ola 3 · Sesión C2)
-- Genera asientos Dr/Cr automáticamente desde expenses/income cuando tenants.gl_enabled=true.
-- El GL es ESCLAVO de la operativa: si gl_enabled=false → no-op (backward-compat total).
-- Diseño: docs-nucleo/ARQUITECTURA-GL-NUCLEO.md §3-4.
-- NOTA de diseño (retención): income postea el monto COMPLETO (Dr 1119 / Cr 4xxx). retention_amount es
--   una reserva gerencial (20% auto-impuesto, settings.retention_pct), NO un pasivo legal → NO va al GL
--   (se sigue rastreando por retention_deposits/paneles). Coincide con D5 del doc de diseño.
-- NOTA (facturas): en C2 todo income es directo (cash-basis). El accrual de facturas + rama AR = C4.
-- NOTA (inventario): los gastos con linked_inventory_movement_id se SALTAN (inventario perpetuo = C3).

-- ============ TAREA 1 · helpers ============

-- Resuelve account_code → id de cuenta HOJA activa del tenant; si no existe usa el catch-all.
create or replace function public._resolve_account(p_tenant_id uuid, p_code text, p_fallback_code text default '6900')
returns uuid language plpgsql stable security definer set search_path to 'public' as $$
declare _id uuid;
begin
  select id into _id from public.chart_of_accounts
    where tenant_id = p_tenant_id and account_code = p_code and not is_header and active limit 1;
  if _id is not null then return _id; end if;
  select id into _id from public.chart_of_accounts
    where tenant_id = p_tenant_id and account_code = p_fallback_code and not is_header and active limit 1;
  if _id is null then raise exception 'Cuenta catch-all % inexistente para tenant %', p_fallback_code, p_tenant_id; end if;
  return _id;
end $$;
revoke execute on function public._resolve_account(uuid, text, text) from public, anon, authenticated;

-- categoría → código de cuenta. 1º el mapeo manual (categories.account_id, C7); si no, heurístico por label.
create or replace function public._category_to_account_code(p_category_id uuid)
returns text language plpgsql stable security definer set search_path to 'public' as $$
declare _kind text; _label text; _acc uuid; _code text;
begin
  select c.kind, c.label, c.account_id into _kind, _label, _acc from public.categories c where c.id = p_category_id;
  if _acc is not null then
    select account_code into _code from public.chart_of_accounts where id = _acc;
    if _code is not null then return _code; end if;
  end if;
  if _kind = 'income' then
    return case
      when _label ilike '%servicio%' then '4100'
      when _label ilike '%venta%' or _label ilike '%producto%' then '4200'
      else '4300' end;
  end if;
  return case  -- expense (o cualquier otro kind que genere gasto)
    when _label ilike '%inventario%' then '5100'
    when _label ilike '%marketing%' or _label ilike '%publicidad%' then '6400'
    when _label ilike '%nómina%' or _label ilike '%nomina%' or _label ilike '%salario%' then '6100'
    when _label ilike '%alquiler%' or _label ilike '%renta%' then '6200'
    when _label ilike '%servicio%' or _label ilike '%utilidad%' or _label ilike '%público%' or _label ilike '%publico%' then '6300'
    when _label ilike '%seguro%' then '6500'
    when _label ilike '%mantenim%' then '6600'
    when _label ilike '%veh%' or _label ilike '%gasolina%' or _label ilike '%combustible%' then '6800'
    when _label ilike '%deprecia%' then '6700'
    else '6900' end;
end $$;
revoke execute on function public._category_to_account_code(uuid) from public, anon, authenticated;

-- Helper central: crea el asiento completo (draft → líneas → posted). Si gl_enabled=false → null.
-- p_lines = [{"account_code","debit","credit","description"}, ...]. El constraint valida balance al commit.
create or replace function public._gl_post(p_tenant_id uuid, p_entry_date date, p_description text, p_source_type text, p_source_id uuid, p_lines jsonb, p_actor uuid default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _je uuid; _by uuid := coalesce(auth.uid(), p_actor); _ln jsonb; _dr numeric; _cr numeric;
begin
  if not coalesce((select gl_enabled from public.tenants where id = p_tenant_id), false) then return null; end if;
  if _by is null then raise exception 'GL post sin actor (journal_entries.created_by es NOT NULL)'; end if;
  insert into public.journal_entries (tenant_id, entry_date, description, entry_type, source_type, source_id, status, posted_at, posted_by, created_by)
    values (p_tenant_id, p_entry_date, p_description, 'auto', p_source_type, p_source_id, 'draft', now(), _by, _by)
    returning id into _je;
  for _ln in select * from jsonb_array_elements(p_lines) loop
    _dr := round(coalesce((_ln->>'debit')::numeric, 0), 2);
    _cr := round(coalesce((_ln->>'credit')::numeric, 0), 2);
    if _dr = 0 and _cr = 0 then continue; end if;
    insert into public.journal_entry_lines (tenant_id, entry_id, account_id, debit, credit, description)
      values (p_tenant_id, _je,
        public._resolve_account(p_tenant_id, _ln->>'account_code', case when _dr > 0 then '6900' else '4300' end),
        _dr, _cr, _ln->>'description');
  end loop;
  update public.journal_entries set status = 'posted' where id = _je;
  return _je;
end $$;
revoke execute on function public._gl_post(uuid, date, text, text, uuid, jsonb, uuid) from public, anon, authenticated;

-- ============ TAREA 2 · posting de expenses ============
create or replace function public._gl_post_expense()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _code text;
begin
  if not coalesce((select gl_enabled from public.tenants where id = NEW.tenant_id), false) then return NEW; end if;
  if NEW.linked_inventory_movement_id is not null then return NEW; end if;  -- inventario perpetuo → C3
  _code := public._category_to_account_code(NEW.category_id);
  perform public._gl_post(NEW.tenant_id, NEW.expense_date, coalesce(nullif(NEW.notes,''), 'Gasto'), 'expense', NEW.id,
    jsonb_build_array(
      jsonb_build_object('account_code', _code,   'debit', NEW.amount, 'credit', 0,          'description', NEW.notes),
      jsonb_build_object('account_code', '1119',  'debit', 0,          'credit', NEW.amount,  'description', 'Salida de efectivo')
    ), NEW.created_by);
  return NEW;
end $$;

-- ============ TAREA 3 · posting de income ============
create or replace function public._gl_post_income()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare _code text;
begin
  if not coalesce((select gl_enabled from public.tenants where id = NEW.tenant_id), false) then return NEW; end if;
  -- C2: todo income es directo (cash). Facturas (accrual + Cr AR) = C4. Retención = managerial (fuera del GL).
  _code := public._category_to_account_code(NEW.category_id);
  perform public._gl_post(NEW.tenant_id, NEW.income_date, coalesce(nullif(NEW.notes,''), 'Ingreso'), 'income', NEW.id,
    jsonb_build_array(
      jsonb_build_object('account_code', '1119',  'debit', NEW.amount, 'credit', 0,          'description', 'Entrada de efectivo'),
      jsonb_build_object('account_code', _code,   'debit', 0,          'credit', NEW.amount,  'description', NEW.notes)
    ), NEW.created_by);
  return NEW;
end $$;

-- ============ soft-void: anula el asiento cuando el gasto/ingreso se anula (deleted_at) ============
create or replace function public._gl_void_on_soft_delete()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if OLD.deleted_at is null and NEW.deleted_at is not null then
    update public.journal_entries
      set status = 'voided', voided_at = now(), voided_by = coalesce(auth.uid(), NEW.deleted_by),
          void_reason = coalesce(nullif(NEW.deleted_reason,''), 'Anulado')
      where tenant_id = NEW.tenant_id and source_type = TG_ARGV[0] and source_id = NEW.id and status = 'posted';
  end if;
  return NEW;
end $$;

-- ============ triggers ============
drop trigger if exists trg_gl_post_expense on public.expenses;
create trigger trg_gl_post_expense after insert on public.expenses
  for each row execute function public._gl_post_expense();

drop trigger if exists trg_gl_void_expense on public.expenses;
create trigger trg_gl_void_expense after update of deleted_at on public.expenses
  for each row execute function public._gl_void_on_soft_delete('expense');

drop trigger if exists trg_gl_post_income on public.income;
create trigger trg_gl_post_income after insert on public.income
  for each row execute function public._gl_post_income();

drop trigger if exists trg_gl_void_income on public.income;
create trigger trg_gl_void_income after update of deleted_at on public.income
  for each row execute function public._gl_void_on_soft_delete('income');
