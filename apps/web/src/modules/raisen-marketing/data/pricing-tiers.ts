import type { PricingTierRow, PricingConfig } from "@raisen-marketing/data/pricing.types";

// Fallback de la sección Precios (idéntico al seed de la migr 200). La landing lo usa hasta que la DB
// responde, o si no hay tiers activos. Así la landing nunca queda vacía si Supabase falla.
export const PRICING_CONFIG_FALLBACK: PricingConfig = {
  id: "", eyebrowEs: "Precios", eyebrowEn: "Pricing",
  titleEs: "Planes que escalan contigo", titleEn: "Plans that scale with you",
};

const base = { currency: "USD", billingPeriod: "month", ctaLabelEs: "Empezar", ctaLabelEn: "Get started", ctaHref: "#lead-form", isActive: true };

export const PRICING_TIERS_FALLBACK: PricingTierRow[] = [
  { ...base, id: "f1", nameEs: "Starter", nameEn: "Starter", price: 49, taglineEs: "Para empezar a digitalizar tu operación", taglineEn: "Start digitalizing your operation",
    featuresEs: ["Hasta 2 módulos", "Landing white-label", "Soporte por email", "1 usuario admin"],
    featuresEn: ["Up to 2 modules", "White-label landing", "Email support", "1 admin user"], isRecommended: false, displayOrder: 1 },
  { ...base, id: "f2", nameEs: "Pro", nameEn: "Pro", price: 149, taglineEs: "El favorito de negocios de servicio", taglineEn: "The favorite of service businesses",
    featuresEs: ["Todos los módulos", "Landing + SEO + PWA", "Soporte prioritario", "Usuarios ilimitados", "Agentes IA", "Fiscal PR"],
    featuresEn: ["All modules", "Landing + SEO + PWA", "Priority support", "Unlimited users", "AI agents", "PR tax compliance"], isRecommended: true, displayOrder: 2 },
  { ...base, id: "f3", nameEs: "Enterprise", nameEn: "Enterprise", price: 349, taglineEs: "Máximo poder y soporte dedicado", taglineEn: "Maximum power and dedicated support",
    featuresEs: ["Todo en Pro", "Soporte dedicado 24/7", "Onboarding personalizado", "API access", "Multi-tenant", "SLA garantizado"],
    featuresEn: ["Everything in Pro", "Dedicated 24/7 support", "Custom onboarding", "API access", "Multi-tenant", "Guaranteed SLA"], isRecommended: false, displayOrder: 3 },
];
