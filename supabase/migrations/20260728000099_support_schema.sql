-- 20260728000099_support_schema.sql
-- MÓDULO SOPORTE/TICKETS (1/2): tickets internos + hilo de comentarios con adjuntos.
-- Categoría vía categories(kind='support_category'). Comentarios con evidence_urls (bucket evidence).
-- VER: ceo/coo todo; creador lo suyo; asignado lo asignado. Gestiona: ceo/coo o el asignado.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  subject text not null, description text,
  category_id uuid references public.categories(id),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_by uuid not null default auth.uid() references auth.users(id),
  assigned_to uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.support_comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id),
  content text not null, evidence_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_ticket_status on public.support_tickets(tenant_id, status, created_at desc);

alter table public.support_tickets enable row level security;
alter table public.support_comments enable row level security;

create policy ticket_ins on public.support_tickets for insert to authenticated
  with check (tenant_id = public.current_tenant());
create policy ticket_sel on public.support_tickets for select to authenticated using (
  tenant_id = public.current_tenant()
  and (public.is_coo_or_above() or created_by = auth.uid() or assigned_to = auth.uid()));
create policy ticket_upd on public.support_tickets for update to authenticated using (
  tenant_id = public.current_tenant() and (public.is_coo_or_above() or assigned_to = auth.uid()));

create policy comment_ins on public.support_comments for insert to authenticated
  with check (tenant_id = public.current_tenant());
create policy comment_sel on public.support_comments for select to authenticated using (
  tenant_id = public.current_tenant() and (public.is_coo_or_above() or exists (
    select 1 from public.support_tickets t where t.id = support_comments.ticket_id
      and (t.created_by = auth.uid() or t.assigned_to = auth.uid()))));

drop trigger if exists trg_updated_at on public.support_tickets;
create trigger trg_updated_at before update on public.support_tickets for each row execute function public.set_updated_at();

-- Ampliar el CHECK de categories.kind para admitir 'support_category'.
alter table public.categories drop constraint if exists categories_kind_check;
alter table public.categories add constraint categories_kind_check check (kind = any (array[
  'income','expense','extraordinary','payment_method','lead_source','service_type','channel','tax_obligation','support_category']));

-- Seed de categorías de soporte para tenants existentes (IT, RRHH, Operaciones, Instalaciones, Otro).
insert into public.categories (tenant_id, kind, label, sort)
select t.id, 'support_category', d.label, d.sort from public.tenants t
cross join (values ('IT',1),('RRHH',2),('Operaciones',3),('Instalaciones',4),('Otro',5)) as d(label, sort)
where not exists (select 1 from public.categories c where c.tenant_id = t.id and c.kind = 'support_category');
