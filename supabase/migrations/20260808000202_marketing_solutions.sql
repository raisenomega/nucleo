-- 202 · Rodaja Solutions E2E (platform-level). Config de sección (eyebrow+título) + N bloques (icono,
-- título/desc ES-EN, bullets, CTA, pill_preset business/partner que pre-marca el lead form, highlight +
-- badge, activo, orden). Editable desde /web/soluciones. RLS pública/is_superadmin. Seed = 4 bloques S2.6.

create table if not exists public.marketing_solutions_config (
  id uuid primary key default gen_random_uuid(),
  eyebrow_es text not null default 'Soluciones',
  eyebrow_en text not null default 'Solutions',
  title_es text not null default 'Soluciones que escalan contigo',
  title_en text not null default 'Solutions that scale with you',
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_solutions (
  id uuid primary key default gen_random_uuid(),
  icon_name text not null default 'Zap',
  title_es text not null default '', title_en text not null default '',
  description_es text not null default '', description_en text not null default '',
  bullets_es text[] not null default '{}', bullets_en text[] not null default '{}',
  cta_label_es text not null default '', cta_label_en text not null default '',
  cta_href text not null default '#lead-form',
  pill_preset text check (pill_preset in ('business','partner')),
  is_highlighted boolean not null default false,
  badge_es text, badge_en text,
  is_active boolean not null default true,
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_marketing_solutions_config_updated_at on public.marketing_solutions_config;
create trigger set_marketing_solutions_config_updated_at before update on public.marketing_solutions_config
  for each row execute function public.set_updated_at();
drop trigger if exists set_marketing_solutions_updated_at on public.marketing_solutions;
create trigger set_marketing_solutions_updated_at before update on public.marketing_solutions
  for each row execute function public.set_updated_at();

insert into public.marketing_solutions_config (id) select gen_random_uuid()
  where not exists (select 1 from public.marketing_solutions_config);

insert into public.marketing_solutions (icon_name, title_es, title_en, description_es, description_en, bullets_es, bullets_en, cta_label_es, cta_label_en, pill_preset, is_highlighted, badge_es, badge_en, display_order)
select * from (values
  ('Calculator','Agente contable IA','AI accountant',
   'Un agente entrenado en las reglas fiscales de PR, México y Colombia: registra, concilia y te avisa antes de cada vencimiento.',
   'An agent trained on the tax rules of PR, Mexico and Colombia: it records, reconciles and alerts you before every deadline.',
   array['Reglas fiscales de PR, México y Colombia','Informativas y deducciones automáticas','Concilia y alerta antes de vencer'],
   array['Tax rules for PR, Mexico and Colombia','Automatic filings and deductions','Reconciles and alerts before deadlines'],
   'Conocer más','Learn more', null::text, true, 'Destacado', 'Featured', 1),
  ('LayoutGrid','Plataforma completa','Full platform',
   'Un solo sistema para toda tu operación: nómina, reportes, documentos y tu propia landing white-label.',
   'One system for your whole operation: payroll, reports, documents and your own white-label landing.',
   array['Nómina y equipo con deducciones','Reportes y analytics de 4 pilares','Documentos, contratos y landing propia'],
   array['Payroll and team with deductions','4-pillar reports and analytics','Documents, contracts and your own landing'],
   'Ver módulos','See modules', null::text, false, null::text, null::text, 2),
  ('Building2','Para tu negocio','For your business',
   'Opera todo bajo tu propia marca: facturación, rutas, equipo y fiscal en un solo sistema, en tu dominio.',
   'Run everything under your own brand: billing, routes, team and taxes in one system, on your domain.',
   array['Opera bajo tu marca','Todos los módulos incluidos','Soporte directo'],
   array['Run under your brand','All modules included','Direct support'],
   'Solicitar acceso','Request access', 'business', false, null::text, null::text, 3),
  ('Handshake','Para agencias y partners','For agencies and partners',
   'Revende NÚCLEO como tu producto: ofrece la plataforma a tus clientes bajo tu marca y tu margen.',
   'Resell NÚCLEO as your product: offer the platform to your clients under your brand and your margin.',
   array['Revende como tu producto','Panel multi-tenant','Comisiones recurrentes'],
   array['Resell as your product','Multi-tenant dashboard','Recurring commissions'],
   'Ser partner','Become a partner', 'partner', false, null::text, null::text, 4)
) v where not exists (select 1 from public.marketing_solutions);

alter table public.marketing_solutions_config enable row level security;
alter table public.marketing_solutions enable row level security;
drop policy if exists msolc_select on public.marketing_solutions_config;
create policy msolc_select on public.marketing_solutions_config for select using (true);
drop policy if exists msolc_admin on public.marketing_solutions_config;
create policy msolc_admin on public.marketing_solutions_config for all using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists msol_select on public.marketing_solutions;
create policy msol_select on public.marketing_solutions for select using (true);
drop policy if exists msol_admin on public.marketing_solutions;
create policy msol_admin on public.marketing_solutions for all using (public.is_superadmin()) with check (public.is_superadmin());
