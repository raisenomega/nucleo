-- 201 · Rodaja Testimonials E2E (platform-level). Config de sección (eyebrow+título) + N testimonios
-- (quote ES-EN, nombre/empresa/rol del cliente, avatar_url, rating 1-5, activo, orden). Editable desde
-- /web/testimonios. Avatares reusan bucket marketing-media (carpeta avatars/). RLS pública/is_superadmin.

create table if not exists public.marketing_testimonials_config (
  id uuid primary key default gen_random_uuid(),
  eyebrow_es text not null default 'Testimonios',
  eyebrow_en text not null default 'Testimonials',
  title_es text not null default 'Lo que dicen nuestros clientes',
  title_en text not null default 'What our clients say',
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_testimonials (
  id uuid primary key default gen_random_uuid(),
  quote_es text not null default '', quote_en text not null default '',
  client_name text not null default '',
  client_company text, client_role text,
  avatar_url text,
  rating int default 5 check (rating between 1 and 5),
  is_active boolean not null default true,
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_marketing_testimonials_config_updated_at on public.marketing_testimonials_config;
create trigger set_marketing_testimonials_config_updated_at before update on public.marketing_testimonials_config
  for each row execute function public.set_updated_at();
drop trigger if exists set_marketing_testimonials_updated_at on public.marketing_testimonials;
create trigger set_marketing_testimonials_updated_at before update on public.marketing_testimonials
  for each row execute function public.set_updated_at();

insert into public.marketing_testimonials_config (id) select gen_random_uuid()
  where not exists (select 1 from public.marketing_testimonials_config);

insert into public.marketing_testimonials (quote_es, quote_en, client_name, client_company, client_role, rating, display_order)
select * from (values
  ('NÚCLEO nos permitió digitalizar toda la operación en una semana. Facturación, rutas y nómina — todo bajo nuestra marca.',
   'NÚCLEO let us digitalize our whole operation in a week. Invoicing, routes and payroll — all under our brand.',
   'Carlos Rivera','Plomería Rivera','Dueño',5,1),
  ('Antes usábamos 4 apps diferentes. Ahora todo está en un solo lugar y mis técnicos completan servicios desde el celular.',
   'We used to juggle 4 different apps. Now everything is in one place and my techs complete jobs from their phone.',
   'María Santos','Santos Landscaping','Gerente de operaciones',5,2),
  ('El módulo fiscal nos ahorró horas de trabajo cada mes. Las alertas de informativas son un salvavidas.',
   'The tax module saves us hours of work every month. The filing alerts are a lifesaver.',
   'Luis Méndez','Méndez Electric','Contador',5,3)
) v where not exists (select 1 from public.marketing_testimonials);

alter table public.marketing_testimonials_config enable row level security;
alter table public.marketing_testimonials enable row level security;
drop policy if exists mtc_select on public.marketing_testimonials_config;
create policy mtc_select on public.marketing_testimonials_config for select using (true);
drop policy if exists mtc_admin on public.marketing_testimonials_config;
create policy mtc_admin on public.marketing_testimonials_config for all using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists mt_select on public.marketing_testimonials;
create policy mt_select on public.marketing_testimonials for select using (true);
drop policy if exists mt_admin on public.marketing_testimonials;
create policy mt_admin on public.marketing_testimonials for all using (public.is_superadmin()) with check (public.is_superadmin());
