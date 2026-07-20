-- 204 · Rodaja Footer E2E (platform-level, fila única). Tagline + contacto + 6 redes (URL nullable → el
-- ícono solo se muestra si hay URL) + copyright con {year}. Editable desde /web/footer. RLS pública/superadmin.
-- Última rodaja del CMS de la landing comercial. Patrón fila única = migr 197 (Hero).

create table if not exists public.marketing_footer (
  id uuid primary key default gen_random_uuid(),
  tagline_es text not null default 'Tu negocio de servicio, bajo control total.',
  tagline_en text not null default 'Your service business, fully under control.',
  contact_email text default 'hola@raisen.agency',
  contact_phone text,
  social_instagram text, social_facebook text, social_linkedin text,
  social_youtube text, social_tiktok text, social_x text,
  copyright_es text not null default '© {year} NÚCLEO. Una plataforma de Raisen Agency. Todos los derechos reservados.',
  copyright_en text not null default '© {year} NÚCLEO. A Raisen Agency platform. All rights reserved.',
  updated_at timestamptz not null default now()
);

drop trigger if exists set_marketing_footer_updated_at on public.marketing_footer;
create trigger set_marketing_footer_updated_at before update on public.marketing_footer
  for each row execute function public.set_updated_at();

insert into public.marketing_footer (id) select gen_random_uuid()
  where not exists (select 1 from public.marketing_footer);

alter table public.marketing_footer enable row level security;
drop policy if exists mfooter_select on public.marketing_footer;
create policy mfooter_select on public.marketing_footer for select using (true);
drop policy if exists mfooter_admin on public.marketing_footer;
create policy mfooter_admin on public.marketing_footer for all using (public.is_superadmin()) with check (public.is_superadmin());
