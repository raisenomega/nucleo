-- 206 · Rodaja Legales E2E (platform-level). Páginas legales de la landing comercial (slug único, título +
-- contenido markdown ES/EN, activa, orden). Ruta pública /legal/{slug} las renderiza (markdown seguro).
-- Footer las linkea dinámicamente (is_active). Editable en /web/legales. RLS pública/is_superadmin. Trigger.
-- Seed = 3 páginas CON contenido placeholder (a diferencia de OMEGA que sembraba vacío) → visibles desde ya.

create table if not exists public.marketing_legal_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_es text not null default '', title_en text not null default '',
  content_es text not null default '', content_en text not null default '',
  is_active boolean not null default true,
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_marketing_legal_pages_updated_at on public.marketing_legal_pages;
create trigger set_marketing_legal_pages_updated_at before update on public.marketing_legal_pages
  for each row execute function public.set_updated_at();

insert into public.marketing_legal_pages (slug, title_es, title_en, content_es, content_en, display_order)
select * from (values
  ('privacidad', 'Política de Privacidad', 'Privacy Policy',
   E'## Política de Privacidad\n\nEn NÚCLEO (una plataforma de Raisen Agency) valoramos tu privacidad. Esta política explica qué datos recopilamos y cómo los usamos.\n\n## Datos que recopilamos\n\nRecopilamos la información que nos proporcionas al solicitar acceso: nombre, correo, teléfono y detalles de tu negocio.\n\n## Uso de la información\n\nUsamos tus datos para contactarte sobre tu solicitud, darte soporte y mejorar la plataforma. No vendemos tu información a terceros.\n\n## Tus derechos\n\nPuedes solicitar acceso, corrección o eliminación de tus datos escribiéndonos a hola@raisen.agency.',
   E'## Privacy Policy\n\nAt NÚCLEO (a Raisen Agency platform) we value your privacy. This policy explains what data we collect and how we use it.\n\n## Data we collect\n\nWe collect the information you provide when requesting access: name, email, phone and details about your business.\n\n## Use of information\n\nWe use your data to contact you about your request, support you and improve the platform. We do not sell your information to third parties.\n\n## Your rights\n\nYou may request access, correction or deletion of your data by writing to hola@raisen.agency.',
   1),
  ('terminos', 'Términos de Servicio', 'Terms of Service',
   E'## Términos de Servicio\n\nAl usar NÚCLEO aceptas estos términos. Léelos con atención.\n\n## Uso de la plataforma\n\nNÚCLEO se ofrece como software para gestionar tu negocio de servicio. Te comprometes a usarlo conforme a la ley.\n\n## Cuentas\n\nEres responsable de mantener la confidencialidad de tu cuenta y de la actividad que ocurra en ella.\n\n## Limitación de responsabilidad\n\nLa plataforma se ofrece tal cual. Raisen Agency no será responsable por daños indirectos derivados del uso del servicio.\n\n## Cambios\n\nPodemos actualizar estos términos y te notificaremos los cambios relevantes.',
   E'## Terms of Service\n\nBy using NÚCLEO you accept these terms. Please read them carefully.\n\n## Use of the platform\n\nNÚCLEO is offered as software to manage your service business. You agree to use it in accordance with the law.\n\n## Accounts\n\nYou are responsible for keeping your account confidential and for the activity that occurs in it.\n\n## Limitation of liability\n\nThe platform is provided as is. Raisen Agency shall not be liable for indirect damages arising from use of the service.\n\n## Changes\n\nWe may update these terms and will notify you of relevant changes.',
   2),
  ('cookies', 'Política de Cookies', 'Cookie Policy',
   E'## Política de Cookies\n\nNÚCLEO usa cookies para que la plataforma funcione y para entender cómo se usa.\n\n## Qué son las cookies\n\nLas cookies son pequeños archivos que se guardan en tu navegador para recordar tus preferencias.\n\n## Cómo las usamos\n\nUsamos cookies esenciales para el inicio de sesión y cookies analíticas para mejorar la experiencia.\n\n## Control\n\nPuedes desactivar las cookies desde la configuración de tu navegador, aunque algunas funciones podrían dejar de operar.',
   E'## Cookie Policy\n\nNÚCLEO uses cookies so the platform works and to understand how it is used.\n\n## What cookies are\n\nCookies are small files saved in your browser to remember your preferences.\n\n## How we use them\n\nWe use essential cookies for sign-in and analytics cookies to improve the experience.\n\n## Control\n\nYou can disable cookies from your browser settings, although some features may stop working.',
   3)
) v where not exists (select 1 from public.marketing_legal_pages);

alter table public.marketing_legal_pages enable row level security;
drop policy if exists mlegal_select on public.marketing_legal_pages;
create policy mlegal_select on public.marketing_legal_pages for select using (true);
drop policy if exists mlegal_admin on public.marketing_legal_pages;
create policy mlegal_admin on public.marketing_legal_pages for all using (public.is_superadmin()) with check (public.is_superadmin());
