-- =============================================
-- Ola 2.5a · IMPORT DE ESTADO DE CUENTA — staging
-- 100% aditivo. No toca get_reconciliation_snapshot, bank_deposits ni bank_balance_records.
-- El parsing/mapeo ocurre en el cliente; la RPC recibe líneas ya estructuradas.
-- =============================================

create table public.bank_import_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant(),
  bank_account_id uuid not null references public.bank_accounts(id) on delete cascade,
  file_name text,
  row_count int not null default 0,
  date_from date,
  date_to date,
  column_map jsonb,              -- el mapeo usado (para pre-cargarlo en el próximo import)
  imported_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.bank_statement_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default current_tenant(),
  bank_account_id uuid not null references public.bank_accounts(id) on delete cascade,
  import_batch_id uuid not null references public.bank_import_batches(id) on delete cascade,
  txn_date date not null,
  description text,
  amount numeric(12,2) not null,     -- FIRMADO: + crédito (entra) / − débito (sale)
  running_balance numeric(12,2),     -- si el CSV lo trae
  external_ref text,                 -- nº cheque / id del banco (dedup)
  match_status text not null default 'unmatched'
    check (match_status in ('unmatched','matched','ignored')),
  raw jsonb,                         -- la fila cruda (auditoría)
  created_at timestamptz not null default now()
);

create index idx_bsl_account_date on public.bank_statement_lines (bank_account_id, txn_date);
create index idx_bsl_status on public.bank_statement_lines (tenant_id, match_status) where match_status = 'unmatched';

-- Dedup de re-imports: misma cuenta + fecha + monto + ref = misma transacción (parcial: solo con ref).
create unique index uq_bsl_dedup on public.bank_statement_lines
  (bank_account_id, txn_date, amount, coalesce(external_ref,''))
  where external_ref is not null and external_ref != '';

alter table public.bank_import_batches enable row level security;
create policy bib_tenant_all on public.bank_import_batches for all
  using (tenant_id = current_tenant()) with check (tenant_id = current_tenant());
alter table public.bank_statement_lines enable row level security;
create policy bsl_tenant_all on public.bank_statement_lines for all
  using (tenant_id = current_tenant()) with check (tenant_id = current_tenant());

-- RPC: recibe { bank_account_id, file_name, column_map, lines:[{txn_date, description, amount, running_balance, external_ref, raw}] }
create or replace function public.import_bank_statement(_payload jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare _t uuid := current_tenant(); _acct uuid := (_payload->>'bank_account_id')::uuid;
  _batch uuid; _ins int := 0; _cnt int; _line jsonb; _total int;
begin
  if not public.can_access_module('reconciliation','create') then raise exception 'NOT_AUTHORIZED'; end if;
  if not exists (select 1 from public.bank_accounts where id=_acct and tenant_id=_t) then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  select count(*) into _total from jsonb_array_elements(_payload->'lines');
  insert into public.bank_import_batches (tenant_id, bank_account_id, file_name, column_map)
    values (_t, _acct, _payload->>'file_name', _payload->'column_map') returning id into _batch;
  for _line in select value from jsonb_array_elements(_payload->'lines') loop
    insert into public.bank_statement_lines (bank_account_id, import_batch_id, txn_date, description, amount, running_balance, external_ref, raw)
    values (_acct, _batch, (_line->>'txn_date')::date, _line->>'description', (_line->>'amount')::numeric,
      nullif(_line->>'running_balance','')::numeric, nullif(_line->>'external_ref',''), _line->'raw')
    on conflict do nothing;
    get diagnostics _cnt = row_count; _ins := _ins + _cnt;
  end loop;
  if _ins = 0 then
    delete from public.bank_import_batches where id=_batch;
    return jsonb_build_object('batch_id', null, 'inserted', 0, 'skipped_duplicates', _total);
  end if;
  update public.bank_import_batches b set row_count = _ins,
    date_from = (select min(txn_date) from public.bank_statement_lines where import_batch_id=_batch),
    date_to = (select max(txn_date) from public.bank_statement_lines where import_batch_id=_batch)
    where b.id = _batch;
  return jsonb_build_object('batch_id', _batch, 'inserted', _ins, 'skipped_duplicates', _total - _ins);
end $function$;
