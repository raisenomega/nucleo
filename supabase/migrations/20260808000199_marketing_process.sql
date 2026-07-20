-- 199 · Rodaja Process E2E (platform-level). Config de sección (eyebrow+título) + N pasos del timeline
-- (número, icono lucide, título/desc ES-EN, orden, activo). Editable desde /web/proceso. RLS lectura
-- pública / escritura is_superadmin(). Seed = los 4 pasos de S2.6 (para verse idéntico). Patrón migr 198.

create table if not exists public.marketing_process_config (
  id uuid primary key default gen_random_uuid(),
  eyebrow_es text not null default 'Cómo funciona',
  eyebrow_en text not null default 'How it works',
  title_es text not null default 'De registrarte a operar, en cuatro pasos',
  title_en text not null default 'From sign-up to operating, in four steps',
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_process_steps (
  id uuid primary key default gen_random_uuid(),
  step_number int not null default 1,
  icon_name text not null default 'ArrowRight',
  title_es text not null default '', title_en text not null default '',
  description_es text not null default '', description_en text not null default '',
  display_order int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_marketing_process_config_updated_at on public.marketing_process_config;
create trigger set_marketing_process_config_updated_at before update on public.marketing_process_config
  for each row execute function public.set_updated_at();
drop trigger if exists set_marketing_process_steps_updated_at on public.marketing_process_steps;
create trigger set_marketing_process_steps_updated_at before update on public.marketing_process_steps
  for each row execute function public.set_updated_at();

insert into public.marketing_process_config (id) select gen_random_uuid()
  where not exists (select 1 from public.marketing_process_config);

insert into public.marketing_process_steps (step_number, icon_name, title_es, title_en, description_es, description_en, display_order)
select * from (values
  (1,'UserPlus','Solicita acceso','Request access','Cuéntanos sobre tu negocio y te activamos en minutos.','Tell us about your business and we''ll activate you in minutes.',1),
  (2,'Palette','Configura tu marca','Set up your brand','Logo, colores, dominio propio — tu plataforma, tu identidad.','Logo, colors, custom domain — your platform, your identity.',2),
  (3,'LayoutDashboard','Opera tu negocio','Run your business','Factura, asigna rutas, gestiona empleados, todo desde un solo panel.','Invoice, assign routes, manage employees, all from one dashboard.',3),
  (4,'TrendingUp','Crece con datos','Grow with data','Reportes, fiscal, IA — decisiones informadas para escalar.','Reports, tax compliance, AI — informed decisions to scale.',4)
) v where not exists (select 1 from public.marketing_process_steps);

alter table public.marketing_process_config enable row level security;
alter table public.marketing_process_steps enable row level security;
drop policy if exists mpc_select on public.marketing_process_config;
create policy mpc_select on public.marketing_process_config for select using (true);
drop policy if exists mpc_admin on public.marketing_process_config;
create policy mpc_admin on public.marketing_process_config for all using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists mps_select on public.marketing_process_steps;
create policy mps_select on public.marketing_process_steps for select using (true);
drop policy if exists mps_admin on public.marketing_process_steps;
create policy mps_admin on public.marketing_process_steps for all using (public.is_superadmin()) with check (public.is_superadmin());
