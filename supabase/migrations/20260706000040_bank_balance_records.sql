-- 20260706000040_bank_balance_records.sql
-- Conciliación v2: saldos registrados (inicial + real) por cuenta/mes + 2 helpers del RPC v2.

create table public.bank_balance_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  bank_account_id uuid not null references public.bank_accounts(id),
  period_month int not null check (period_month between 1 and 12),
  period_year int not null,
  opening_balance numeric(12,2) not null default 0,
  real_balance numeric(12,2) not null default 0,
  cutoff_date date, notes text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, bank_account_id, period_year, period_month)
);
alter table public.bank_balance_records enable row level security;
create policy bank_balance_records_all on public.bank_balance_records
  for all to authenticated using (tenant_id = public.current_tenant()) with check (tenant_id = public.current_tenant());

-- Helper GAP 3: desglose de expenses por categoría del mes.
create or replace function public.expense_breakdown_for(tid uuid, m0 date, m1 date)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('category', coalesce(c.label,'—'), 'amount', s.amt) order by s.amt desc), '[]'::jsonb)
  from (select category_id, sum(amount) amt from public.expenses
        where tenant_id = tid and expense_date >= m0 and expense_date < m1 and deleted_at is null
        group by category_id) s
  left join public.categories c on c.id = s.category_id;
$$;

-- Helper GAP 2+4: serie mensual del año fiscal (ingresos, egresos, retención, margen, acumulado).
create or replace function public.monthly_series_for(tid uuid, yr int, pct numeric)
returns jsonb language sql stable security definer set search_path = public as $$
  with agg as (
    select m,
      coalesce((select sum(amount) from public.income i where i.tenant_id=tid and extract(year from i.income_date)=yr and extract(month from i.income_date)=m and i.deleted_at is null),0) as inc,
      coalesce((select sum(amount) from public.expenses e where e.tenant_id=tid and extract(year from e.expense_date)=yr and extract(month from e.expense_date)=m and e.deleted_at is null),0)
      + coalesce((select sum(amount) from public.payroll p where p.tenant_id=tid and extract(year from p.pay_date)=yr and extract(month from p.pay_date)=m and p.deleted_at is null),0)
      + coalesce((select sum(amount) from public.extraordinary_payments x where x.tenant_id=tid and extract(year from x.payment_date)=yr and extract(month from x.payment_date)=m and x.deleted_at is null),0)
      + coalesce((select sum(amount) from public.marketing_expenses k where k.tenant_id=tid and extract(year from k.expense_date)=yr and extract(month from k.expense_date)=m and k.deleted_at is null),0) as out
    from generate_series(1,12) as m
  ),
  calc as (
    select m, inc, out, round(inc*pct/100,2) as ret, inc-out as profit,
      case when inc>0 then round((inc-out)/inc*100,1) else 0 end as margin,
      round(sum(inc*pct/100) over (order by m),2) as accum from agg
  )
  select coalesce(jsonb_agg(jsonb_build_object('month',m,'income',inc,'retention',ret,'totalOut',out,
    'operatingProfit',profit,'margin',margin,'accumulated',accum) order by m),'[]'::jsonb) from calc;
$$;
