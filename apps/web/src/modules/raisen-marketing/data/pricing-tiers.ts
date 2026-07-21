import type { PricingTierRow, PricingConfig } from "@raisen-marketing/data/pricing.types";

// Fallback de la sección Precios (idéntico al seed de la migr 214). La landing lo usa hasta que la DB
// responde, o si no hay tiers activos. Así la landing nunca queda vacía si Supabase falla.
// OJO: si cambian los precios en la DB, hay que cambiarlos AQUÍ también o el fallback muestra tarifas viejas.
export const PRICING_CONFIG_FALLBACK: PricingConfig = {
  id: "", eyebrowEs: "Precios", eyebrowEn: "Pricing",
  titleEs: "Planes que escalan contigo", titleEn: "Plans that scale with you",
  disclaimerEs: "Todos los planes incluyen setup de implementación por $3,500 USD (una sola vez). Incluye configuración de marca, migración de datos, entrenamiento y acompañamiento post-lanzamiento.",
  disclaimerEn: "All plans include a one-time $3,500 USD implementation setup. Includes brand configuration, data migration, training, and post-launch support.",
};

const base = { currency: "USD", billingPeriod: "month", ctaLabelEs: "Solicitar demo", ctaLabelEn: "Book a demo", ctaHref: "/demo", isActive: true };

export const PRICING_TIERS_FALLBACK: PricingTierRow[] = [
  { ...base, id: "f1", nameEs: "Starter", nameEn: "Starter", price: 249, taglineEs: "Digitaliza tu operación desde el día uno", taglineEn: "Digitalize your operation from day one",
    featuresEs: ["Usuarios ilimitados", "Facturación y cotizaciones", "Portal de clientes", "Landing white-label básica", "Reportes básicos", "Soporte por email"],
    featuresEn: ["Unlimited users", "Billing and quotes", "Client portal", "Basic white-label landing", "Basic reports", "Email support"], isRecommended: false, displayOrder: 1 },
  { ...base, id: "f2", nameEs: "Pro", nameEn: "Pro", price: 449, taglineEs: "La plataforma completa para crecer", taglineEn: "The complete platform to grow",
    featuresEs: ["Todo de Starter", "Rutas y operaciones de campo", "Nómina y gestión de talento", "Landing completa + SEO + PWA", "Reportes avanzados (4 pilares)", "Gestión documental y contratos", "Auto-contabilidad", "CRM integrado", "Soporte por email + chat"],
    featuresEn: ["Everything in Starter", "Routes and field operations", "Payroll and talent management", "Full landing + SEO + PWA", "Advanced reports (4 pillars)", "Document and contract management", "Auto-accounting", "Integrated CRM", "Email + chat support"], isRecommended: true, displayOrder: 2 },
  { ...base, id: "f3", nameEs: "Enterprise", nameEn: "Enterprise", price: 649, taglineEs: "Máximo poder y soporte dedicado", taglineEn: "Maximum power and dedicated support",
    featuresEs: ["Todo de Pro", "Módulo fiscal PR integrado", "Agentes IA base (asistente de negocio)", "Multi-departamento", "API access", "Soporte dedicado prioritario", "Onboarding personalizado"],
    featuresEn: ["Everything in Pro", "PR tax compliance module", "Base AI agents (business assistant)", "Multi-department", "API access", "Dedicated priority support", "Personalized onboarding"], isRecommended: false, displayOrder: 3 },
];
