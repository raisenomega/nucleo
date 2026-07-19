-- 197 · Rodaja Hero E2E de la landing comercial (platform-level, NO multi-tenant). Fila única editable
-- desde /web/hero por el Super Admin. Lectura pública (landing anónima). Seed = copy EXACTO de S2.6
-- (para que el hero se vea idéntico tras migrar). RLS write = is_superadmin() (claim user_role). Patrón
-- de OMEGA 00093 adaptado (OMEGA usaba resellers.is_super_owner; NÚCLEO usa el helper is_superadmin()).

create table if not exists public.marketing_hero (
  id uuid primary key default gen_random_uuid(),
  title_es text not null default 'Tu negocio de servicio, bajo control total',
  subtitle_es text not null default 'Facturación, rutas, empleados, impuestos, landing y agentes IA — todo integrado bajo tu marca. NÚCLEO es el sistema operativo que tu negocio de servicio necesita.',
  cta_label_es text not null default 'Solicitar acceso',
  scroll_text text not null default 'scroll',
  title_en text not null default 'Your service business, fully under control',
  subtitle_en text not null default 'Billing, routes, employees, taxes, landing pages and AI agents — all integrated under your brand. NÚCLEO is the operating system your service business needs.',
  cta_label_en text not null default 'Request access',
  cta_href text not null default '#lead-form',
  background_video_url text,
  background_image_url text,
  media_overlay_opacity numeric(3,2) not null default 0.5 check (media_overlay_opacity between 0 and 1),
  show_scroll_indicator boolean not null default true,
  show_3d_scene boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_marketing_hero_updated_at on public.marketing_hero;
create trigger set_marketing_hero_updated_at before update on public.marketing_hero
  for each row execute function public.set_updated_at();

insert into public.marketing_hero (id) select gen_random_uuid()
  where not exists (select 1 from public.marketing_hero);

alter table public.marketing_hero enable row level security;
drop policy if exists marketing_hero_select on public.marketing_hero;
create policy marketing_hero_select on public.marketing_hero for select using (true);
drop policy if exists marketing_hero_admin on public.marketing_hero;
create policy marketing_hero_admin on public.marketing_hero for all
  using (public.is_superadmin()) with check (public.is_superadmin());

-- Bucket de media de la landing comercial (público lectura, 50MB, mp4/webm + jpg/png/webp).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marketing-media','marketing-media', true, 52428800,
  array['video/mp4','video/webm','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "marketing_media_read" on storage.objects;
create policy "marketing_media_read" on storage.objects for select using (bucket_id = 'marketing-media');
drop policy if exists "marketing_media_write" on storage.objects;
create policy "marketing_media_write" on storage.objects for insert
  with check (bucket_id = 'marketing-media' and public.is_superadmin());
drop policy if exists "marketing_media_update" on storage.objects;
create policy "marketing_media_update" on storage.objects for update
  using (bucket_id = 'marketing-media' and public.is_superadmin());
drop policy if exists "marketing_media_delete" on storage.objects;
create policy "marketing_media_delete" on storage.objects for delete
  using (bucket_id = 'marketing-media' and public.is_superadmin());
