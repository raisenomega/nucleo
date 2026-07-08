-- 20260726000094_observations.sql
-- MÓDULO OBSERVACIONES: bitácora de coaching/incidentes por empleado (contexto para evaluaciones).
-- Firma digital (tamper-evident) + requires_follow_up automático por categoría. RLS via
-- can_access_module('observations',*) (ceo/coo por catch-all; operaciones/servicio sin acceso).

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  employee_id uuid not null references public.profiles(id),
  observer_id uuid not null default auth.uid() references auth.users(id),
  category text not null check (category in ('LOGRO','OPORTUNIDAD_MEJORA','INCIDENTE','CULTURAL','SUGERENCIA_DESARROLLO')),
  notes text not null,
  requires_follow_up boolean not null default false,
  follow_up_date date,
  digital_signature text,
  created_at timestamptz not null default now()
);
create index if not exists idx_obs_employee on public.observations(tenant_id, employee_id, created_at desc);

alter table public.observations enable row level security;
create policy obs_sel on public.observations for select to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('observations','view'));
create policy obs_ins on public.observations for insert to authenticated
  with check (tenant_id = public.current_tenant() and public.can_access_module('observations','create'));
create policy obs_del on public.observations for delete to authenticated
  using (tenant_id = public.current_tenant() and public.can_access_module('observations','delete'));

-- Guarda observación: firma base64(observer:employee:timestamp) + follow-up auto para INCIDENTE/OPORTUNIDAD_MEJORA.
create or replace function public.save_observation(p_employee_id uuid, p_category text, p_notes text, p_follow_up date default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare _id uuid; _sig text; _follow boolean;
begin
  if not public.can_access_module('observations','create') then raise exception 'No autorizado'; end if;
  _follow := p_category in ('INCIDENTE','OPORTUNIDAD_MEJORA');
  _sig := encode(convert_to(auth.uid()::text || ':' || p_employee_id::text || ':' || now()::text, 'UTF8'), 'base64');
  insert into public.observations(tenant_id, employee_id, observer_id, category, notes, requires_follow_up, follow_up_date, digital_signature)
    values (public.current_tenant(), p_employee_id, auth.uid(), p_category, p_notes, _follow,
      case when _follow then p_follow else null end, _sig)
    returning id into _id;
  return _id;
end $$;
grant execute on function public.save_observation(uuid, text, text, date) to authenticated;
