-- GL · Cierre fiscal + asientos manuales + apertura (Ola 3 · Sesión C10)
-- current_tenant() + is_ceo_or_above(). El cierre mueve nominales a 3300; el P&L (C8) sigue excluyendo
-- is_closing_entry (muestra el resultado operativo del período, no $0 — correcto). El efecto se ve en el Balance.

-- ============ Cierre fiscal anual ============
create or replace function public.close_fiscal_year(p_year int)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _by uuid := auth.uid(); _je uuid; _ni numeric; _re uuid;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  if p_year >= extract(year from current_date)::int then raise exception 'PERIOD_NOT_ENDED'; end if;
  if exists (select 1 from public.journal_entries where tenant_id=_t and is_closing_entry and period_year=p_year and status<>'voided')
    then raise exception 'ALREADY_CLOSED'; end if;
  select coalesce(sum(l.credit)-sum(l.debit),0) into _ni
    from public.journal_entry_lines l join public.journal_entries e on e.id=l.entry_id join public.chart_of_accounts a on a.id=l.account_id
    where e.tenant_id=_t and e.period_year=p_year and e.status='posted' and a.account_type in ('revenue','expense','cogs');
  if not exists (select 1 from public.journal_entries e join public.journal_entry_lines l on l.entry_id=e.id join public.chart_of_accounts a on a.id=l.account_id
    where e.tenant_id=_t and e.period_year=p_year and e.status='posted' and a.account_type in ('revenue','expense','cogs'))
    then raise exception 'NOTHING_TO_CLOSE'; end if;
  select id into _re from public.chart_of_accounts where tenant_id=_t and account_code='3300';
  insert into public.journal_entries (tenant_id, entry_date, description, entry_type, source_type, status, is_closing_entry, created_by)
    values (_t, make_date(p_year,12,31), 'Cierre fiscal año '||p_year, 'auto', 'closing', 'draft', true, _by) returning id into _je;
  insert into public.journal_entry_lines (tenant_id, entry_id, account_id, debit, credit, description)
  select _t, _je, a.id, greatest(-(sum(l.debit)-sum(l.credit)),0), greatest(sum(l.debit)-sum(l.credit),0), 'Cierre nominal'
    from public.journal_entry_lines l join public.journal_entries e on e.id=l.entry_id join public.chart_of_accounts a on a.id=l.account_id
    where e.tenant_id=_t and e.period_year=p_year and e.status='posted' and a.account_type in ('revenue','expense','cogs')
    group by a.id having sum(l.debit)<>sum(l.credit);
  if _ni <> 0 then
    insert into public.journal_entry_lines (tenant_id, entry_id, account_id, debit, credit, description)
      values (_t, _je, _re, greatest(-_ni,0), greatest(_ni,0), 'Utilidad neta a retenidas');
  end if;
  update public.journal_entries set status='posted', posted_at=now(), posted_by=_by where id=_je;
  return _je;
end $function$;
grant execute on function public.close_fiscal_year(int) to authenticated;

create or replace function public.reopen_fiscal_year(p_year int)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant();
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  update public.journal_entries set status='voided', voided_at=now(), voided_by=auth.uid(), void_reason='Reapertura del año '||p_year
    where tenant_id=_t and is_closing_entry and period_year=p_year and status='posted';
end $function$;
grant execute on function public.reopen_fiscal_year(int) to authenticated;

-- ============ Asientos manuales ============
-- p_lines = [{"account_id": uuid, "debit": n, "credit": n, "description": text}]
create or replace function public.create_manual_entry(p_date date, p_description text, p_lines jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _by uuid := auth.uid(); _je uuid; _ln jsonb;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  if p_description is null or btrim(p_description)='' then raise exception 'DESCRIPTION_REQUIRED'; end if;
  insert into public.journal_entries (tenant_id, entry_date, description, entry_type, status, created_by)
    values (_t, p_date, p_description, 'manual', 'draft', _by) returning id into _je;
  for _ln in select * from jsonb_array_elements(p_lines) loop
    insert into public.journal_entry_lines (tenant_id, entry_id, account_id, debit, credit, description)
      values (_t, _je, (_ln->>'account_id')::uuid, round(coalesce((_ln->>'debit')::numeric,0),2), round(coalesce((_ln->>'credit')::numeric,0),2), _ln->>'description');
  end loop;
  return _je;   -- balance validado por el constraint diferido al commit
end $function$;
grant execute on function public.create_manual_entry(date, text, jsonb) to authenticated;

create or replace function public.post_journal_entry(p_entry_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  update public.journal_entries set status='posted', posted_at=now(), posted_by=auth.uid()
    where id=p_entry_id and tenant_id=current_tenant() and status='draft';
  if not found then raise exception 'NOT_DRAFT'; end if;
end $function$;
grant execute on function public.post_journal_entry(uuid) to authenticated;

create or replace function public.void_journal_entry(p_entry_id uuid, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  update public.journal_entries set status='voided', voided_at=now(), voided_by=auth.uid(), void_reason=coalesce(nullif(btrim(p_reason),''),'Anulado')
    where id=p_entry_id and tenant_id=current_tenant() and status in ('draft','posted');
  if not found then raise exception 'CANNOT_VOID'; end if;
end $function$;
grant execute on function public.void_journal_entry(uuid, text) to authenticated;

create or replace function public.delete_journal_entry(p_entry_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  delete from public.journal_entries where id=p_entry_id and tenant_id=current_tenant() and status='draft';
  if not found then raise exception 'NOT_DRAFT'; end if;
end $function$;
grant execute on function public.delete_journal_entry(uuid) to authenticated;

-- ============ Asiento de apertura ============
-- p_balances = [{"account_code": "1119", "debit": n, "credit": n}]
create or replace function public.create_opening_entry(p_balances jsonb, p_date date default current_date)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare _t uuid := current_tenant(); _by uuid := auth.uid(); _je uuid; _ln jsonb; _acc uuid;
begin
  if not public.is_ceo_or_above() then raise exception 'No autorizado'; end if;
  if exists (select 1 from public.journal_entries where tenant_id=_t and source_type='opening' and status<>'voided')
    then raise exception 'OPENING_EXISTS'; end if;
  insert into public.journal_entries (tenant_id, entry_date, description, entry_type, source_type, status, created_by)
    values (_t, p_date, 'Asiento de apertura', 'auto', 'opening', 'draft', _by) returning id into _je;
  for _ln in select * from jsonb_array_elements(p_balances) loop
    select id into _acc from public.chart_of_accounts where tenant_id=_t and account_code=_ln->>'account_code' and not is_header and active;
    if _acc is not null and (coalesce((_ln->>'debit')::numeric,0)<>0 or coalesce((_ln->>'credit')::numeric,0)<>0) then
      insert into public.journal_entry_lines (tenant_id, entry_id, account_id, debit, credit, description)
        values (_t, _je, _acc, round(coalesce((_ln->>'debit')::numeric,0),2), round(coalesce((_ln->>'credit')::numeric,0),2), 'Saldo inicial');
    end if;
  end loop;
  update public.journal_entries set status='posted', posted_at=now(), posted_by=_by where id=_je;
  return _je;
end $function$;
grant execute on function public.create_opening_entry(jsonb, date) to authenticated;
