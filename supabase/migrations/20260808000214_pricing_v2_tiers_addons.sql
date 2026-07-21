-- 214 · Pricing v2: estructura final de planes + add-ons verticales + nota de setup.
--
-- Sustituye por completo lo sembrado en la migr 200 y ajustado en la 213. Los registros viejos NO se borran:
-- se desactivan (is_active=false) para preservar el histórico de precios.
--   Tiers  : Starter $249 · Pro $449 ★ · Enterprise $649 (todos mensuales)
--   Add-ons: App nativa $6,500 pago único + 4 agentes IA verticales ($149 fiscal, $99 ventas/soporte/RRHH)
--   Setup  : $3,500 pago único — nota editable desde /web/precios (disclaimer_es/en)

-- 1 · Nota de setup: columnas nuevas en la config de la sección (editables en el Super Admin).
alter table public.marketing_pricing_config
  add column if not exists disclaimer_es text not null default '',
  add column if not exists disclaimer_en text not null default '';

update public.marketing_pricing_config set
  title_es = 'Planes que escalan contigo',
  title_en = 'Plans that scale with you',
  disclaimer_es = 'Todos los planes incluyen setup de implementación por $3,500 USD (una sola vez). Incluye configuración de marca, migración de datos, entrenamiento y acompañamiento post-lanzamiento.',
  disclaimer_en = 'All plans include a one-time $3,500 USD implementation setup. Includes brand configuration, data migration, training, and post-launch support.';

-- 2 · Tiers: se retiran los anteriores y entran los tres definitivos.
update public.marketing_pricing_tiers set is_active = false, is_recommended = false;

insert into public.marketing_pricing_tiers
  (name_es, name_en, price, currency, billing_period, tagline_es, tagline_en,
   features_es, features_en, cta_label_es, cta_label_en, cta_href,
   is_recommended, is_active, display_order)
values
  ('Starter', 'Starter', 249, 'USD', 'month',
   'Digitaliza tu operación desde el día uno', 'Digitalize your operation from day one',
   array['Usuarios ilimitados','Facturación y cotizaciones','Portal de clientes','Landing white-label básica','Reportes básicos','Soporte por email'],
   array['Unlimited users','Billing and quotes','Client portal','Basic white-label landing','Basic reports','Email support'],
   'Solicitar demo', 'Book a demo', '/demo', false, true, 1),

  ('Pro', 'Pro', 449, 'USD', 'month',
   'La plataforma completa para crecer', 'The complete platform to grow',
   array['Todo de Starter','Rutas y operaciones de campo','Nómina y gestión de talento','Landing completa + SEO + PWA','Reportes avanzados (4 pilares)','Gestión documental y contratos','Auto-contabilidad','CRM integrado','Soporte por email + chat'],
   array['Everything in Starter','Routes and field operations','Payroll and talent management','Full landing + SEO + PWA','Advanced reports (4 pillars)','Document and contract management','Auto-accounting','Integrated CRM','Email + chat support'],
   'Solicitar demo', 'Book a demo', '/demo', true, true, 2),

  ('Enterprise', 'Enterprise', 649, 'USD', 'month',
   'Máximo poder y soporte dedicado', 'Maximum power and dedicated support',
   array['Todo de Pro','Módulo fiscal PR integrado','Agentes IA base (asistente de negocio)','Multi-departamento','API access','Soporte dedicado prioritario','Onboarding personalizado'],
   array['Everything in Pro','PR tax compliance module','Base AI agents (business assistant)','Multi-department','API access','Dedicated priority support','Personalized onboarding'],
   'Solicitar demo', 'Book a demo', '/demo', false, true, 3);

-- 3 · Add-ons: se retiran los tres genéricos de la migr 210 y entran los verticales.
update public.marketing_pricing_addons set is_active = false;

insert into public.marketing_pricing_addons
  (name_es, name_en, description_es, description_en, price, currency, billing_period, is_active, display_order)
values
  ('App nativa white-label', 'White-label native app',
   'App iOS y Android bajo tu marca y dominio. Incluye build, deploy en App Store y Google Play, y configuración de push notifications.',
   'iOS and Android app under your brand and domain. Includes build, App Store and Google Play deploy, and push notification setup.',
   6500, 'USD', 'one_time', true, 1),

  ('Agente fiscal y contable IA', 'AI tax & accounting agent',
   'Agente especializado en cumplimiento fiscal para Puerto Rico, México y Colombia. Reglas versionadas, alertas de informativas, cálculo automático de deducciones y estrategias de optimización.',
   'Agent specialized in tax compliance for Puerto Rico, Mexico and Colombia. Versioned rules, filing alerts, automatic deduction calculation and optimization strategies.',
   149, 'USD', 'month', true, 2),

  ('Agente de ventas IA', 'AI sales agent',
   'Agente entrenado para calificar leads, responder consultas de clientes y agendar reuniones automáticamente por chat y WhatsApp.',
   'Agent trained to qualify leads, answer client inquiries and automatically schedule meetings via chat and WhatsApp.',
   99, 'USD', 'month', true, 3),

  ('Agente de soporte IA', 'AI support agent',
   'Agente dedicado a atención al cliente 24/7. Responde preguntas frecuentes, gestiona tickets y escala a un humano cuando es necesario.',
   'Dedicated 24/7 customer support agent. Answers FAQs, manages tickets and escalates to a human when needed.',
   99, 'USD', 'month', true, 4),

  ('Agente de recursos humanos IA', 'AI HR agent',
   'Agente para gestión de talento: onboarding automatizado, respuestas a consultas de empleados, tracking de evaluaciones y alertas de compliance laboral.',
   'Talent management agent: automated onboarding, employee inquiry responses, evaluation tracking and labor compliance alerts.',
   99, 'USD', 'month', true, 5);

-- 4 · Email comercial (idempotente: la migr 213 ya lo puso, se reafirma).
update public.marketing_footer set contact_email = 'ventas@raisen.agency'
 where contact_email is distinct from 'ventas@raisen.agency';
