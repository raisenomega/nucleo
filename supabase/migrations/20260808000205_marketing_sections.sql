-- 205 · Rodaja Secciones E2E (platform-level). Visibilidad + orden de cada sección de la landing (keys
-- FIJOS · no se agregan/eliminan, solo togglear/reordenar). La landing renderiza según is_visible+display_order.
-- Seed = ORDEN REAL ACTUAL del JSX de MarketingRoot (hero,features,process,solutions,pricing,testimonials,
-- lead_form) para que la landing quede idéntica. NOTA: el orden del spec difería del real; se usó el real.
-- El footer NO está en la tabla (siempre visible). Hero está pero es no-toggleable en el editor. RLS pública/superadmin.

create table if not exists public.marketing_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  label_es text not null default '', label_en text not null default '',
  is_visible boolean not null default true,
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_marketing_sections_updated_at on public.marketing_sections;
create trigger set_marketing_sections_updated_at before update on public.marketing_sections
  for each row execute function public.set_updated_at();

insert into public.marketing_sections (section_key, label_es, label_en, display_order) values
  ('hero',         'Hero',        'Hero',         1),
  ('features',     'Servicios',   'Features',     2),
  ('process',      'Proceso',     'Process',      3),
  ('solutions',    'Soluciones',  'Solutions',    4),
  ('pricing',      'Precios',     'Pricing',      5),
  ('testimonials', 'Testimonios', 'Testimonials', 6),
  ('lead_form',    'Formulario',  'Lead Form',    7)
on conflict (section_key) do nothing;

alter table public.marketing_sections enable row level security;
drop policy if exists msec_select on public.marketing_sections;
create policy msec_select on public.marketing_sections for select using (true);
drop policy if exists msec_admin on public.marketing_sections;
create policy msec_admin on public.marketing_sections for all using (public.is_superadmin()) with check (public.is_superadmin());
