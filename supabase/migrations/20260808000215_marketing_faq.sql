-- 215 · Rodaja FAQ E2E (platform-level). Sección de preguntas frecuentes de la landing comercial.
--
-- POR QUÉ: desde la migr 213 el JSON-LD emite un FAQPage con preguntas que NO existían en ninguna parte de
-- la página. Google exige que el structured data corresponda a contenido visible; declarar preguntas que el
-- visitante no ve es incumplimiento. Esta rodaja crea la sección visible y convierte esta tabla en la ÚNICA
-- fuente tanto del acordeón como del FAQPage, así no pueden volver a divergir.
-- Editable en /web/faq. RLS pública/is_superadmin. Triggers.

create table if not exists public.marketing_faq_config (
  id uuid primary key default gen_random_uuid(),
  eyebrow_es text not null default 'Preguntas frecuentes',
  eyebrow_en text not null default 'FAQ',
  title_es text not null default 'Lo que más nos preguntan',
  title_en text not null default 'Frequently asked questions',
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_faqs (
  id uuid primary key default gen_random_uuid(),
  question_es text not null default '', question_en text not null default '',
  answer_es text not null default '', answer_en text not null default '',
  is_active boolean not null default true,
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_marketing_faq_config_updated_at on public.marketing_faq_config;
create trigger set_marketing_faq_config_updated_at before update on public.marketing_faq_config
  for each row execute function public.set_updated_at();
drop trigger if exists set_marketing_faqs_updated_at on public.marketing_faqs;
create trigger set_marketing_faqs_updated_at before update on public.marketing_faqs
  for each row execute function public.set_updated_at();

insert into public.marketing_faq_config (id)
select gen_random_uuid() where not exists (select 1 from public.marketing_faq_config);

insert into public.marketing_faqs (question_es, question_en, answer_es, answer_en, display_order)
select * from (values
  ('¿Qué es NÚCLEO?', 'What is NÚCLEO?',
   'NÚCLEO es una plataforma de gestión operacional para PYMEs y empresas grandes. Integra facturación, operaciones, nómina, fiscal, landing white-label y agentes IA en un solo sistema bajo la marca del cliente. Se adapta a cualquier industria en Puerto Rico y Latinoamérica.',
   'NÚCLEO is an operational management platform for SMBs and large companies. It integrates billing, operations, payroll, tax compliance, white-label landing pages and AI agents in a single system under the client''s brand. It adapts to any industry in Puerto Rico and Latin America.', 1),
  ('¿Para qué tipo de empresa es NÚCLEO?', 'What type of business is NÚCLEO for?',
   'Para cualquier empresa que necesite estructura departamental y gestión integrada — desde PYMEs hasta empresas grandes, en cualquier industria y nicho. NÚCLEO simplifica sistemas de gestión empresarial complejos en soluciones accesibles y escalables.',
   'For any business that needs departmental structure and integrated management — from SMBs to large companies, in any industry and niche. NÚCLEO simplifies complex business management systems into accessible and scalable solutions.', 2),
  ('¿Cuánto cuesta NÚCLEO?', 'How much does NÚCLEO cost?',
   'NÚCLEO tiene 3 planes: Starter desde $249/mes, Pro desde $449/mes y Enterprise desde $649/mes. Todos incluyen usuarios ilimitados y un setup de implementación de $3,500.',
   'NÚCLEO has 3 plans: Starter from $249/month, Pro from $449/month and Enterprise from $649/month. All include unlimited users and a $3,500 implementation setup.', 3),
  ('¿Qué incluye el setup de implementación?', 'What does the implementation setup include?',
   'Configuración de marca (logo, colores, dominio), migración de datos, configuración de módulos según tu operación, landing white-label con contenido, 2 sesiones de entrenamiento y 1 semana de acompañamiento post-lanzamiento.',
   'Brand configuration (logo, colors, domain), data migration, module setup according to your operation, white-label landing with content, 2 training sessions and 1 week of post-launch support.', 4),
  ('¿Puedo usar NÚCLEO con mi propia marca?', 'Can I use NÚCLEO with my own brand?',
   'Sí. NÚCLEO es 100% white-label. Tu cliente ve tu marca, tu dominio, tu logo — nunca la marca de NÚCLEO.',
   'Yes. NÚCLEO is 100% white-label. Your client sees your brand, your domain, your logo — never the NÚCLEO brand.', 5),
  ('¿NÚCLEO cumple con la regulación fiscal de Puerto Rico?', 'Does NÚCLEO comply with Puerto Rico tax regulations?',
   'Sí. El plan Enterprise incluye un motor de contribución con reglas versionadas, alertas de informativas y estrategias de optimización fiscal. Además, el agente fiscal IA (add-on) automatiza el cumplimiento para PR, México y Colombia.',
   'Yes. The Enterprise plan includes a tax engine with versioned rules, filing alerts and optimization strategies. Additionally, the AI tax agent (add-on) automates compliance for PR, Mexico and Colombia.', 6),
  ('¿Hay límite de usuarios?', 'Is there a user limit?',
   'No. Todos los planes incluyen usuarios ilimitados. No cobramos por persona que acceda al sistema.',
   'No. All plans include unlimited users. We don''t charge per person accessing the system.', 7),
  ('¿Puedo conectar NÚCLEO con OMEGA?', 'Can I connect NÚCLEO with OMEGA?',
   'Sí. OMEGA (marketing con IA) y NÚCLEO (operaciones) se conectan por API. Los leads de marketing entran directo al CRM operacional y las ventas alimentan los reportes.',
   'Yes. OMEGA (AI marketing) and NÚCLEO (operations) connect via API. Marketing leads flow directly into the operational CRM and sales feed the reports.', 8)
) v where not exists (select 1 from public.marketing_faqs);

alter table public.marketing_faq_config enable row level security;
drop policy if exists mfaqcfg_select on public.marketing_faq_config;
create policy mfaqcfg_select on public.marketing_faq_config for select using (true);
drop policy if exists mfaqcfg_admin on public.marketing_faq_config;
create policy mfaqcfg_admin on public.marketing_faq_config for all using (public.is_superadmin()) with check (public.is_superadmin());

alter table public.marketing_faqs enable row level security;
drop policy if exists mfaqs_select on public.marketing_faqs;
create policy mfaqs_select on public.marketing_faqs for select using (true);
drop policy if exists mfaqs_admin on public.marketing_faqs;
create policy mfaqs_admin on public.marketing_faqs for all using (public.is_superadmin()) with check (public.is_superadmin());

-- Sección nueva en el control de visibilidad/orden. Se coloca ANTES de lead_form: la FAQ resuelve objeciones
-- justo antes del formulario, que es donde convierte.
insert into public.marketing_sections (section_key, label_es, label_en, is_visible, display_order)
select 'faq', 'Preguntas frecuentes', 'FAQ', true,
       coalesce((select display_order from public.marketing_sections where section_key = 'lead_form'), 99)
where not exists (select 1 from public.marketing_sections where section_key = 'faq');

update public.marketing_sections set display_order = display_order + 1
 where section_key = 'lead_form'
   and display_order <= (select display_order from public.marketing_sections where section_key = 'faq');
