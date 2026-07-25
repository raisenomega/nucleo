-- GL FUNDACIONAL (Ola 3 · Contabilidad · Sesión C1)
-- Plan de cuentas + Libro Mayor (asientos Dr/Cr) + seed template PR + flag gl_enabled.
-- Diseño: docs-nucleo/ARQUITECTURA-GL-NUCLEO.md. SOLO schema/constraints/RLS/seed.
-- NO toca posting, NO toca triggers existentes de income/expenses, NO toca UI.
-- Backward-compat: gl_enabled=false para TODOS los tenants → cero efecto hasta activar.

-- ============ TAREA 1 · flags en tenants ============
alter table public.tenants
  add column if not exists gl_enabled boolean not null default false,
  add column if not exists fiscal_year_start_month integer not null default 1
    check (fiscal_year_start_month between 1 and 12);

-- ============ TAREA 2 · chart_of_accounts ============
create table if not exists public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  account_code text not null,
  account_name text not null,
  account_type text not null check (account_type in ('asset','liability','equity','revenue','expense','cogs')),
  parent_id uuid references public.chart_of_accounts(id),
  is_header boolean not null default false,
  normal_balance text not null check (normal_balance in ('debit','credit')),
  is_system boolean not null default false,
  description text,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, account_code)
);

-- ============ TAREA 3 · journal_entries + journal_entry_lines ============
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entry_number text not null,
  entry_date date not null,
  description text not null,
  entry_type text not null default 'auto' check (entry_type in ('manual','auto')),
  source_type text check (source_type in ('expense','income','invoice','invoice_payment','payroll','inventory','bank','adjustment','closing','opening')),
  source_id uuid,
  status text not null default 'draft' check (status in ('draft','posted','voided')),
  period_year integer not null,
  period_month integer not null check (period_month between 1 and 12),
  posted_at timestamptz,
  posted_by uuid references public.profiles(id),
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  void_reason text,
  is_closing_entry boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, entry_number)
);

-- journal_entry_lines: +tenant_id directo (patrón del validador §8 → RLS directa)
create table if not exists public.journal_entry_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.chart_of_accounts(id),
  debit numeric not null default 0 check (debit >= 0),
  credit numeric not null default 0 check (credit >= 0),
  description text,
  line_no integer,
  constraint line_debit_or_credit check (debit = 0 or credit = 0),
  constraint line_nonzero check (debit > 0 or credit > 0)
);

-- ============ TAREA 7 · índices ============
create index if not exists idx_jel_account on public.journal_entry_lines (account_id);
create index if not exists idx_jel_entry on public.journal_entry_lines (entry_id);
create index if not exists idx_je_period on public.journal_entries (tenant_id, period_year, period_month);
create index if not exists idx_je_source on public.journal_entries (tenant_id, source_type, source_id);
create unique index if not exists uq_je_source_live on public.journal_entries (tenant_id, source_type, source_id)
  where source_type is not null and status <> 'voided';   -- idempotencia: 1 asiento vivo por evento fuente
create index if not exists idx_coa_parent on public.chart_of_accounts (tenant_id, parent_id);
create index if not exists idx_coa_type on public.chart_of_accounts (tenant_id, account_type);

-- ============ FUNCIONES: numeración + defaults + balance ============
create or replace function public._next_journal_number(p_tenant_id uuid)
returns text language sql stable security definer set search_path to 'public' as $$
  select 'JE-' || lpad((coalesce(max(nullif(regexp_replace(entry_number, '[^0-9]', '', 'g'), '')::int), 0) + 1)::text, 4, '0')
  from public.journal_entries where tenant_id = p_tenant_id;
$$;

create or replace function public._journal_entry_defaults()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.entry_number is null then new.entry_number := public._next_journal_number(new.tenant_id); end if;
  new.period_year := extract(year from new.entry_date);
  new.period_month := extract(month from new.entry_date);
  return new;
end $$;

-- El constraint MÁS importante del GL: SUM(debit) = SUM(credit) por asiento (diferido al commit).
create or replace function public._check_journal_balance()
returns trigger language plpgsql set search_path to 'public' as $$
declare _entry_id uuid; _diff numeric;
begin
  _entry_id := coalesce(new.entry_id, old.entry_id);
  select abs(coalesce(sum(debit),0) - coalesce(sum(credit),0)) into _diff
  from public.journal_entry_lines where entry_id = _entry_id;
  if _diff > 0.001 then
    raise exception 'Asiento desbalanceado (%): diferencia Dr/Cr de %', _entry_id, _diff using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;

-- Guard de líneas: solo cuentas hoja/activas del mismo tenant; líneas solo mutables mientras el asiento es draft.
create or replace function public._jel_guard()
returns trigger language plpgsql set search_path to 'public' as $$
declare _acc record; _st text; _etid uuid;
begin
  select account_type, is_header, active, tenant_id into _acc from public.chart_of_accounts where id = new.account_id;
  if not found then raise exception 'Cuenta contable inexistente'; end if;
  if _acc.tenant_id <> new.tenant_id then raise exception 'La cuenta no pertenece al tenant del asiento'; end if;
  if _acc.is_header then raise exception 'No se puede postear a una cuenta de grupo (header): %', new.account_id; end if;
  if not _acc.active then raise exception 'No se puede postear a una cuenta inactiva'; end if;
  select status, tenant_id into _st, _etid from public.journal_entries where id = new.entry_id;
  if _etid <> new.tenant_id then raise exception 'La línea y el asiento son de tenants distintos'; end if;
  if _st is distinct from 'draft' then raise exception 'Las líneas solo se pueden modificar mientras el asiento es draft (estado: %)', _st; end if;
  return new;
end $$;

-- Guard de asientos: posted/voided son inmutables (solo se permite draft→ y posted→voided sin mover la fecha).
create or replace function public._je_guard()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if old.status = 'voided' then raise exception 'Un asiento anulado es inmutable'; end if;
  if old.status = 'posted' then
    if new.status <> 'voided' then raise exception 'Un asiento posteado solo se puede anular (void), no editar'; end if;
    if new.entry_date <> old.entry_date then raise exception 'No se puede cambiar la fecha al anular'; end if;
  end if;
  return new;
end $$;

-- Guard del plan de cuentas: las cuentas de sistema no se borran ni cambian de código/tipo.
create or replace function public._coa_guard()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if tg_op = 'DELETE' then
    if old.is_system then raise exception 'Una cuenta de sistema no se puede borrar (desactívala en su lugar)'; end if;
    return old;
  end if;
  if old.is_system and (new.account_code <> old.account_code or new.account_type <> old.account_type) then
    raise exception 'Una cuenta de sistema no puede cambiar de código ni tipo';
  end if;
  return new;
end $$;

-- ============ TRIGGERS ============
drop trigger if exists trg_journal_entry_defaults on public.journal_entries;
create trigger trg_journal_entry_defaults before insert on public.journal_entries
  for each row execute function public._journal_entry_defaults();

drop trigger if exists trg_je_guard on public.journal_entries;
create trigger trg_je_guard before update on public.journal_entries
  for each row execute function public._je_guard();

-- period lock reutiliza el trigger genérico existente (columna de fecha = entry_date)
drop trigger if exists aa_enforce_period_lock on public.journal_entries;
create trigger aa_enforce_period_lock before insert or update or delete on public.journal_entries
  for each row execute function public.enforce_period_lock('entry_date');

drop trigger if exists trg_updated_at on public.journal_entries;
create trigger trg_updated_at before update on public.journal_entries
  for each row execute function public.set_updated_at();

drop trigger if exists trg_jel_guard on public.journal_entry_lines;
create trigger trg_jel_guard before insert or update on public.journal_entry_lines
  for each row execute function public._jel_guard();

drop trigger if exists trg_check_journal_balance on public.journal_entry_lines;
create constraint trigger trg_check_journal_balance
  after insert or update or delete on public.journal_entry_lines
  deferrable initially deferred
  for each row execute function public._check_journal_balance();

drop trigger if exists trg_coa_guard on public.chart_of_accounts;
create trigger trg_coa_guard before update or delete on public.chart_of_accounts
  for each row execute function public._coa_guard();

drop trigger if exists trg_updated_at on public.chart_of_accounts;
create trigger trg_updated_at before update on public.chart_of_accounts
  for each row execute function public.set_updated_at();

-- ============ TAREA 4 · RLS ============
alter table public.chart_of_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_entry_lines enable row level security;

-- chart_of_accounts: SELECT tenant; escritura CEO (is_system protegido por trigger)
create policy coa_select on public.chart_of_accounts for select using (tenant_id = public.current_tenant());
create policy coa_insert on public.chart_of_accounts for insert with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());
create policy coa_update on public.chart_of_accounts for update using (tenant_id = public.current_tenant() and public.is_ceo_or_above()) with check (tenant_id = public.current_tenant());
create policy coa_delete on public.chart_of_accounts for delete using (tenant_id = public.current_tenant() and public.is_ceo_or_above());

-- journal_entries: SELECT tenant; INSERT/UPDATE CEO (inmutabilidad por trigger); DELETE denegado (sin policy → solo CASCADE de tenant)
create policy je_select on public.journal_entries for select using (tenant_id = public.current_tenant());
create policy je_insert on public.journal_entries for insert with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());
create policy je_update on public.journal_entries for update using (tenant_id = public.current_tenant() and public.is_ceo_or_above()) with check (tenant_id = public.current_tenant());

-- journal_entry_lines: SELECT tenant; INSERT/UPDATE CEO; DELETE solo si el asiento padre es draft
create policy jel_select on public.journal_entry_lines for select using (tenant_id = public.current_tenant());
create policy jel_insert on public.journal_entry_lines for insert with check (tenant_id = public.current_tenant() and public.is_ceo_or_above());
create policy jel_update on public.journal_entry_lines for update using (tenant_id = public.current_tenant() and public.is_ceo_or_above()) with check (tenant_id = public.current_tenant());
create policy jel_delete on public.journal_entry_lines for delete using (
  tenant_id = public.current_tenant() and public.is_ceo_or_above()
  and exists (select 1 from public.journal_entries e where e.id = journal_entry_lines.entry_id and e.status = 'draft'));

-- ============ TAREA 6 · mapeo categorías → cuentas ============
alter table public.categories add column if not exists account_id uuid references public.chart_of_accounts(id);

-- ============ TAREA 5 · seed del plan de cuentas (template PR servicios) ============
create or replace function public._seed_chart_of_accounts(p_tenant_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.chart_of_accounts (tenant_id, account_code, account_name, account_type, is_header, normal_balance, is_system) values
    (p_tenant_id,'1000','Activos','asset',true,'debit',true),
    (p_tenant_id,'1100','Activos Corrientes','asset',true,'debit',true),
    (p_tenant_id,'1110','Efectivo y Bancos','asset',true,'debit',true),
    (p_tenant_id,'1119','Efectivo y Caja','asset',false,'debit',true),
    (p_tenant_id,'1120','Cuentas por Cobrar','asset',false,'debit',true),
    (p_tenant_id,'1130','Inventario','asset',false,'debit',true),
    (p_tenant_id,'1140','Prepagos','asset',false,'debit',true),
    (p_tenant_id,'1200','Activos Fijos','asset',true,'debit',true),
    (p_tenant_id,'1210','Equipos','asset',false,'debit',true),
    (p_tenant_id,'1220','Vehículos','asset',false,'debit',true),
    (p_tenant_id,'1230','Depreciación Acumulada','asset',false,'credit',true),
    (p_tenant_id,'2000','Pasivos','liability',true,'credit',true),
    (p_tenant_id,'2100','Pasivos Corrientes','liability',true,'credit',true),
    (p_tenant_id,'2110','Cuentas por Pagar','liability',false,'credit',true),
    (p_tenant_id,'2120','Impuestos por Pagar','liability',false,'credit',true),
    (p_tenant_id,'2130','Nómina por Pagar','liability',false,'credit',true),
    (p_tenant_id,'2140','Retenciones por Pagar','liability',false,'credit',true),
    (p_tenant_id,'2200','Pasivos a Largo Plazo','liability',true,'credit',true),
    (p_tenant_id,'2210','Préstamos','liability',false,'credit',true),
    (p_tenant_id,'3000','Capital','equity',true,'credit',true),
    (p_tenant_id,'3100','Capital del Propietario','equity',false,'credit',true),
    (p_tenant_id,'3200','Utilidad del Período','equity',false,'credit',true),
    (p_tenant_id,'3300','Utilidades Retenidas','equity',false,'credit',true),
    (p_tenant_id,'4000','Ingresos','revenue',true,'credit',true),
    (p_tenant_id,'4100','Ingresos por Servicios','revenue',false,'credit',true),
    (p_tenant_id,'4200','Ventas de Productos','revenue',false,'credit',true),
    (p_tenant_id,'4300','Otros Ingresos','revenue',false,'credit',true),
    (p_tenant_id,'5000','Costo de Ventas (COGS)','cogs',true,'debit',true),
    (p_tenant_id,'5100','Costo de Materiales','cogs',false,'debit',true),
    (p_tenant_id,'5200','Costo de Mano de Obra Directa','cogs',false,'debit',true),
    (p_tenant_id,'6000','Gastos Operativos','expense',true,'debit',true),
    (p_tenant_id,'6100','Nómina y Beneficios','expense',false,'debit',true),
    (p_tenant_id,'6110','Aportes Patronales','expense',false,'debit',true),
    (p_tenant_id,'6200','Alquiler','expense',false,'debit',true),
    (p_tenant_id,'6300','Servicios Públicos','expense',false,'debit',true),
    (p_tenant_id,'6400','Marketing','expense',false,'debit',true),
    (p_tenant_id,'6500','Seguros','expense',false,'debit',true),
    (p_tenant_id,'6600','Mantenimiento','expense',false,'debit',true),
    (p_tenant_id,'6700','Depreciación','expense',false,'debit',true),
    (p_tenant_id,'6800','Gastos de Vehículo','expense',false,'debit',true),
    (p_tenant_id,'6900','Otros Gastos','expense',false,'debit',true),
    (p_tenant_id,'7000','Gastos No Operativos','expense',true,'debit',true),
    (p_tenant_id,'7100','Intereses','expense',false,'debit',true),
    (p_tenant_id,'7200','Pérdidas / Mermas','expense',false,'debit',true)
  on conflict (tenant_id, account_code) do nothing;

  -- jerarquía: resolver parent_id por (hijo → padre) explícito
  update public.chart_of_accounts c set parent_id = p.id
  from (values
    ('1100','1000'),('1200','1000'),
    ('1110','1100'),('1120','1100'),('1130','1100'),('1140','1100'),
    ('1119','1110'),
    ('1210','1200'),('1220','1200'),('1230','1200'),
    ('2100','2000'),('2200','2000'),
    ('2110','2100'),('2120','2100'),('2130','2100'),('2140','2100'),
    ('2210','2200'),
    ('3100','3000'),('3200','3000'),('3300','3000'),
    ('4100','4000'),('4200','4000'),('4300','4000'),
    ('5100','5000'),('5200','5000'),
    ('6100','6000'),('6110','6000'),('6200','6000'),('6300','6000'),('6400','6000'),
    ('6500','6000'),('6600','6000'),('6700','6000'),('6800','6000'),('6900','6000'),
    ('7100','7000'),('7200','7000')
  ) as m(child, parent)
  join public.chart_of_accounts p on p.tenant_id = p_tenant_id and p.account_code = m.parent
  where c.tenant_id = p_tenant_id and c.account_code = m.child and c.parent_id is null;
end $$;
revoke execute on function public._seed_chart_of_accounts(uuid) from public, anon, authenticated;

-- Tenants NUEVOS nacen con el plan de cuentas (gl_enabled sigue false → sin posting hasta activar).
-- Tenants EXISTENTES (Zafacones/VitalMotion/trials) NO se re-seedean aquí.
create or replace function private._seed_trial_tenant(_tenant_id uuid)
returns void language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
begin
  insert into public.settings (tenant_id, key, value) values
    (_tenant_id, 'order_prefix', to_jsonb('TR'::text)), (_tenant_id, 'retention_enabled', to_jsonb(false))
  on conflict (tenant_id, key) do nothing;
  insert into public.tenant_themes (tenant_id) values (_tenant_id) on conflict (tenant_id) do nothing;
  insert into public.tenant_landing_config (tenant_id, hero_title, hero_cta_type)
    select _tenant_id, coalesce(nullif(trim(t.display_name),''), nullif(trim(t.legal_name),''), 'Bienvenido'), 'quote'
    from public.tenants t where t.id = _tenant_id on conflict (tenant_id) do nothing;
  insert into public.warehouses (tenant_id, name, code, is_default) values (_tenant_id, 'Almacén Principal', 'ALM-PRINCIPAL', true)
    on conflict (tenant_id, code) do nothing;
  insert into public.categories (tenant_id, kind, label, sort) values
    (_tenant_id,'income','Ventas',1),(_tenant_id,'income','Servicios',2),(_tenant_id,'income','Otros ingresos',3),
    (_tenant_id,'expense','Nómina',1),(_tenant_id,'expense','Materiales',2),(_tenant_id,'expense','Renta',3),
    (_tenant_id,'payment_method','Efectivo',1),(_tenant_id,'payment_method','Transferencia',2),
    (_tenant_id,'support_category','IT',1),(_tenant_id,'support_category','RRHH',2),(_tenant_id,'support_category','Operaciones',3),
    (_tenant_id,'support_category','Instalaciones',4),(_tenant_id,'support_category','Otro',5),
    (_tenant_id,'inventory_category','Limpieza',1),(_tenant_id,'inventory_category','Equipos',2),
    (_tenant_id,'inventory_category','Químicos',3),(_tenant_id,'inventory_category','Repuestos',4),
    (_tenant_id,'inventory_category','Seguridad',5),(_tenant_id,'inventory_category','Oficina',6),
    (_tenant_id,'inventory_category','Otro',7)
  on conflict (tenant_id, kind, label) do nothing;
  insert into public.units_of_measure (tenant_id, name, abbreviation, uom_group, is_default) values
    (_tenant_id,'Unidad','un','count',true),(_tenant_id,'Caja','cj','count',false),(_tenant_id,'Par','par','count',false),
    (_tenant_id,'Galón','gal','volume',false),(_tenant_id,'Litro','lt','volume',false),(_tenant_id,'Libra','lb','weight',false),
    (_tenant_id,'Pie','ft','length',false),(_tenant_id,'Rollo','rollo','other',false),(_tenant_id,'Paquete','paq','count',false)
  on conflict (tenant_id, abbreviation) do nothing;
  perform public._seed_chart_of_accounts(_tenant_id);   -- C1: plan de cuentas para tenants nuevos
end; $function$;
