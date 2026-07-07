-- 20260725000092_evaluations_schema.sql
-- MÓDULO EVALUACIONES (1/2): scoring de desempeño ponderado + clasificación + compliance PR (Ley 80).
-- 3 tablas: criterios (pesos configurables por tenant), evaluaciones (composite + clasificación +
-- flags de probatorio/validación legal), scores por criterio. RLS via can_access_module('evaluations',*)
-- (ceo/coo lo reciben por el catch-all; operaciones/servicio no). Seed de 3 criterios default por tenant.

create table if not exists public.evaluation_criteria (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  label text not null, weight numeric(4,3) not null default 0.333, sort int not null default 0,
  active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  employee_id uuid not null references public.profiles(id),
  period text not null,
  composite_score numeric(4,2), classification text,
  in_probation boolean not null default false, requires_legal_validation boolean not null default false,
  status text not null default 'completed', notes text,
  evaluator_id uuid not null default auth.uid() references auth.users(id),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.evaluation_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  criterion_id uuid not null references public.evaluation_criteria(id),
  score numeric(4,2) not null, created_at timestamptz not null default now(),
  unique (evaluation_id, criterion_id)
);
create index if not exists idx_eval_employee on public.evaluations(tenant_id, employee_id);

alter table public.evaluation_criteria enable row level security;
alter table public.evaluations enable row level security;
alter table public.evaluation_scores enable row level security;

-- Policies: SELECT = evaluations.view · escritura = evaluations.edit/create/delete. Todo tenant-scoped.
create policy eval_crit_sel on public.evaluation_criteria for select to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('evaluations','view'));
create policy eval_crit_wr on public.evaluation_criteria for all to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('evaluations','edit'))
  with check (tenant_id = public.current_tenant() and public.can_access_module('evaluations','edit'));
create policy eval_sel on public.evaluations for select to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('evaluations','view'));
create policy eval_ins on public.evaluations for insert to authenticated
  with check (tenant_id = public.current_tenant() and public.can_access_module('evaluations','create'));
create policy eval_upd on public.evaluations for update to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('evaluations','edit'));
create policy eval_del on public.evaluations for delete to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('evaluations','delete'));
create policy eval_sc_sel on public.evaluation_scores for select to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('evaluations','view'));
create policy eval_sc_wr on public.evaluation_scores for all to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('evaluations','edit'))
  with check (tenant_id = public.current_tenant() and public.can_access_module('evaluations','create'));

drop trigger if exists trg_updated_at on public.evaluations;
create trigger trg_updated_at before update on public.evaluations
  for each row execute function public.set_updated_at();

-- Seed 3 criterios default por tenant que no tenga ninguno (Operacional 50% · Cultura 30% · Desarrollo 20%).
insert into public.evaluation_criteria (tenant_id, label, weight, sort)
select t.id, d.label, d.weight, d.sort
from public.tenants t
cross join (values ('Operacional',0.5,1),('Visión y Cultura',0.3,2),('Desarrollo de Equipo',0.2,3)) as d(label,weight,sort)
where not exists (select 1 from public.evaluation_criteria ec where ec.tenant_id = t.id);
