-- =============================================
-- Ola 2.5b · Motor de auto-match + líneas huérfanas
-- El estado de match vive en la LÍNEA/puente, NUNCA muta income/expense → esquiva el period lock.
-- No toca get_reconciliation_snapshot ni bank_deposits.
-- =============================================

create table public.bank_line_matches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant(),
  line_id uuid not null references public.bank_statement_lines(id) on delete cascade,
  entry_type text not null check (entry_type in ('income','expense')),
  entry_id uuid not null,
  amount numeric(12,2) not null,     -- cuánto de la línea cubre esta entrada
  matched_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index idx_blm_line on public.bank_line_matches (line_id);
create index idx_blm_entry on public.bank_line_matches (entry_type, entry_id);
-- Una entrada no se puede matchear dos veces
create unique index uq_blm_entry on public.bank_line_matches (tenant_id, entry_type, entry_id);

alter table public.bank_line_matches enable row level security;
create policy blm_tenant_all on public.bank_line_matches for all
  using (tenant_id = current_tenant()) with check (tenant_id = current_tenant());

-- suggest_matches: por cada línea unmatched del mes, candidatos con monto EXACTO + fecha ±5d (no auto-confirma).
create or replace function public.suggest_matches(_bank_account_id uuid, _month date)
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  with t as (select case when public.can_access_module('reconciliation','view') then public.current_tenant() else null end tid,
             date_trunc('month',_month)::date m0, (date_trunc('month',_month)+interval '1 month')::date m1),
  lines as (
    select l.* from public.bank_statement_lines l, t
    where l.bank_account_id=_bank_account_id and l.tenant_id=t.tid and l.match_status='unmatched'
      and l.txn_date>=t.m0 and l.txn_date<t.m1
  ),
  cand as (
    select l.id line_id, 'income' etype, i.id eid, i.amount amt, i.income_date edate, i.notes descr,
           100 - abs(l.txn_date - i.income_date)*10 score
    from lines l join public.income i on i.tenant_id=l.tenant_id and i.deleted_at is null
      and i.amount=l.amount and abs(i.income_date - l.txn_date) <= 5
    where l.amount > 0 and not exists (select 1 from public.bank_line_matches m where m.entry_type='income' and m.entry_id=i.id)
    union all
    select l.id, 'expense', e.id, e.amount, e.expense_date, e.notes,
           100 - abs(l.txn_date - e.expense_date)*10
    from lines l join public.expenses e on e.tenant_id=l.tenant_id and e.deleted_at is null
      and e.amount = -l.amount and abs(e.expense_date - l.txn_date) <= 5
    where l.amount < 0 and not exists (select 1 from public.bank_line_matches m where m.entry_type='expense' and m.entry_id=e.id)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'line_id', l.id, 'line', jsonb_build_object('txn_date',l.txn_date,'description',l.description,'amount',l.amount),
    'candidates', coalesce((select jsonb_agg(jsonb_build_object('entry_type',c.etype,'entry_id',c.eid,
        'amount',c.amt,'date',c.edate,'description',c.descr,'score',c.score) order by c.score desc, c.edate)
      from cand c where c.line_id=l.id), '[]'::jsonb)
  ) order by l.txn_date), '[]'::jsonb)
  from lines l;
$function$;

-- list_unmatched_entries: income/expense del mes NO matcheados (para el modal de selección manual / agrupado).
create or replace function public.list_unmatched_entries(_month date, _type text)
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  with t as (select case when public.can_access_module('reconciliation','view') then public.current_tenant() else null end tid,
             date_trunc('month',_month)::date m0, (date_trunc('month',_month)+interval '1 month')::date m1)
  select coalesce(jsonb_agg(x order by x->>'date'), '[]'::jsonb) from (
    select jsonb_build_object('entry_id',i.id,'amount',i.amount,'date',i.income_date,'description',i.notes) x
    from public.income i, t where _type='income' and i.tenant_id=t.tid and i.deleted_at is null
      and i.income_date>=t.m0 and i.income_date<t.m1
      and not exists (select 1 from public.bank_line_matches m where m.entry_type='income' and m.entry_id=i.id)
    union all
    select jsonb_build_object('entry_id',e.id,'amount',e.amount,'date',e.expense_date,'description',e.notes)
    from public.expenses e, t where _type='expense' and e.tenant_id=t.tid and e.deleted_at is null
      and e.expense_date>=t.m0 and e.expense_date<t.m1
      and not exists (select 1 from public.bank_line_matches m where m.entry_type='expense' and m.entry_id=e.id)
  ) s;
$function$;

-- list_line_matches: entradas enlazadas a una línea (para el badge "conciliada" y desvincular).
create or replace function public.list_line_matches(_line_id uuid)
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object('entry_type',entry_type,'entry_id',entry_id,'amount',amount)), '[]'::jsonb)
  from public.bank_line_matches where line_id=_line_id and tenant_id=public.current_tenant();
$function$;

-- confirm_match: enlaza la línea a 1..N entradas (depósito agrupado). Suma debe cuadrar con abs(monto). No muta income.
create or replace function public.confirm_match(_line_id uuid, _entries jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _line public.bank_statement_lines; _sum numeric; _e jsonb;
begin
  if not public.can_access_module('reconciliation','create') then raise exception 'NOT_AUTHORIZED'; end if;
  select * into _line from public.bank_statement_lines where id=_line_id and tenant_id=_t;
  if not found then raise exception 'LINE_NOT_FOUND'; end if;
  select coalesce(sum((value->>'amount')::numeric),0) into _sum from jsonb_array_elements(_entries);
  if abs(_sum - abs(_line.amount)) > 0.01 then raise exception 'SUM_MISMATCH: % vs %', _sum, abs(_line.amount); end if;
  for _e in select value from jsonb_array_elements(_entries) loop
    insert into public.bank_line_matches (tenant_id, line_id, entry_type, entry_id, amount)
    values (_t, _line_id, _e->>'entry_type', (_e->>'entry_id')::uuid, (_e->>'amount')::numeric);
  end loop;
  update public.bank_statement_lines set match_status='matched' where id=_line_id;
  return jsonb_build_object('status','ok','matched',jsonb_array_length(_entries));
exception when unique_violation then raise exception 'ALREADY_MATCHED';
end $function$;

-- unmatch_line: borra los matches y vuelve a unmatched. Las entradas quedan libres.
create or replace function public.unmatch_line(_line_id uuid)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant();
begin
  if not public.can_access_module('reconciliation','create') then raise exception 'NOT_AUTHORIZED'; end if;
  delete from public.bank_line_matches where line_id=_line_id and tenant_id=_t;
  update public.bank_statement_lines set match_status='unmatched' where id=_line_id and tenant_id=_t;
  return jsonb_build_object('status','ok');
end $function$;

-- ignore_line: ruido que no es ingreso ni gasto (guarda el motivo en raw).
create or replace function public.ignore_line(_line_id uuid, _reason text)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant();
begin
  if not public.can_access_module('reconciliation','create') then raise exception 'NOT_AUTHORIZED'; end if;
  update public.bank_statement_lines
    set match_status='ignored', raw = coalesce(raw,'{}'::jsonb) || jsonb_build_object('ignore_reason', _reason)
    where id=_line_id and tenant_id=_t;
  return jsonb_build_object('status','ok');
end $function$;

-- create_entry_from_line: para huérfanas (comisión/interés). Crea income/expense + match. Respeta el period lock.
create or replace function public.create_entry_from_line(_line_id uuid, _payload jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _line public.bank_statement_lines; _eid uuid; _etype text; _amt numeric;
begin
  if not public.can_access_module('reconciliation','create') then raise exception 'NOT_AUTHORIZED'; end if;
  select * into _line from public.bank_statement_lines where id=_line_id and tenant_id=_t;
  if not found then raise exception 'LINE_NOT_FOUND'; end if;
  if _line.match_status <> 'unmatched' then raise exception 'LINE_NOT_UNMATCHED'; end if;
  _amt := abs(_line.amount); _etype := case when _line.amount >= 0 then 'income' else 'expense' end;
  if _etype='income' then
    insert into public.income (tenant_id, category_id, payment_method_id, amount, income_date, notes, created_by)
      values (_t, (_payload->>'category_id')::uuid, (_payload->>'payment_method_id')::uuid, _amt, _line.txn_date,
        coalesce(_payload->>'notes', _line.description), auth.uid()) returning id into _eid;
  else
    insert into public.expenses (tenant_id, category_id, payment_method_id, amount, expense_date, notes, created_by)
      values (_t, (_payload->>'category_id')::uuid, (_payload->>'payment_method_id')::uuid, _amt, _line.txn_date,
        coalesce(_payload->>'notes', _line.description), auth.uid()) returning id into _eid;
  end if;
  insert into public.bank_line_matches (tenant_id, line_id, entry_type, entry_id, amount) values (_t, _line_id, _etype, _eid, _amt);
  update public.bank_statement_lines set match_status='matched' where id=_line_id;
  return jsonb_build_object('status','ok','entry_type',_etype,'entry_id',_eid);
end $function$;
