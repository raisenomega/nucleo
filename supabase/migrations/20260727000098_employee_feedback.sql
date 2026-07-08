-- 20260727000098_employee_feedback.sql
-- FEEDBACK DEL EMPLEADO: opiniones/sugerencias/reconocimientos/quejas/cultura. Cualquier miembro del
-- tenant puede ENVIAR. VER: ceo/coo todo; autor lo suyo; target lo recibido (si no es anónimo).
-- Campos ai_* quedan NULL en v1 (los llenará el agente IA de AGENTE-IA-NUCLEO.md vía Railway/Claude).

create table if not exists public.employee_feedback (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants(id),
  author_id uuid not null default auth.uid() references auth.users(id),
  target_id uuid references public.profiles(id),  -- null = feedback general de la empresa
  feedback_type text not null check (feedback_type in ('suggestion','praise','concern','culture','anonymous_tip')),
  content text not null,
  is_anonymous boolean not null default false,
  ai_sentiment text,              -- positive/neutral/negative (Claude analiza el texto)
  ai_score_impact numeric,        -- -0.5 a +0.5 (cuánto afecta el score del target)
  ai_category text,               -- qué criterio de evaluación afecta
  ai_reasoning text,              -- por qué la IA tomó esa decisión
  ai_processed_at timestamptz,
  acknowledged_by uuid references auth.users(id),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_feedback_target on public.employee_feedback(tenant_id, target_id, created_at desc);

alter table public.employee_feedback enable row level security;

-- Cualquier miembro del tenant puede enviar feedback.
create policy feedback_ins on public.employee_feedback for insert to authenticated
  with check (tenant_id = public.current_tenant());
-- Ver: ceo/coo todo; autor lo suyo; target lo recibido (si no es anónimo).
create policy feedback_sel on public.employee_feedback for select to authenticated using (
  tenant_id = public.current_tenant()
  and (public.is_coo_or_above() or author_id = auth.uid() or (target_id = auth.uid() and not is_anonymous)));
-- Acusar recibo: solo ceo/coo.
create policy feedback_upd on public.employee_feedback for update to authenticated
  using (tenant_id = public.current_tenant() and public.is_coo_or_above())
  with check (tenant_id = public.current_tenant() and public.is_coo_or_above());

-- Acusar recibo (ceo/coo).
create or replace function public.acknowledge_feedback(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_coo_or_above() then raise exception 'No autorizado'; end if;
  update public.employee_feedback set acknowledged_by = auth.uid(), acknowledged_at = now()
    where id = p_id and tenant_id = current_tenant();
end $$;
grant execute on function public.acknowledge_feedback(uuid) to authenticated;
