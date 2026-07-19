// 3 tiers de precios (PARTE 7.4). Precios placeholder — editables desde el CMS (S4). Features razonables por tier.
export type PricingTier = {
  nameEs: string; nameEn: string; price: number; currency: string; billingPeriod: string;
  taglineEs: string; taglineEn: string; featuresEs: string[]; featuresEn: string[];
  ctaLabelEs: string; ctaLabelEn: string; isRecommended: boolean;
};

export const TIERS: PricingTier[] = [
  { nameEs: "Starter", nameEn: "Starter", price: 49, currency: "USD", billingPeriod: "month",
    taglineEs: "Para empezar a digitalizar tu operación", taglineEn: "Start digitalizing your operation",
    featuresEs: ["Hasta 3 módulos", "Facturación y cotizaciones", "Landing white-label", "Soporte por email"],
    featuresEn: ["Up to 3 modules", "Billing and quotes", "White-label landing", "Email support"],
    ctaLabelEs: "Empezar", ctaLabelEn: "Get started", isRecommended: false },
  { nameEs: "Pro", nameEn: "Pro", price: 149, currency: "USD", billingPeriod: "month",
    taglineEs: "El favorito de negocios de servicio", taglineEn: "The favorite of service businesses",
    featuresEs: ["Todos los módulos", "Rutas y campo", "Fiscal PR", "Agentes IA", "Soporte prioritario"],
    featuresEn: ["All modules", "Routes & field", "PR tax compliance", "AI agents", "Priority support"],
    ctaLabelEs: "Empezar", ctaLabelEn: "Get started", isRecommended: true },
  { nameEs: "Enterprise", nameEn: "Enterprise", price: 349, currency: "USD", billingPeriod: "month",
    taglineEs: "Máximo poder y soporte dedicado", taglineEn: "Maximum power and dedicated support",
    featuresEs: ["Todo de Pro", "Multi-sucursal", "Onboarding dedicado", "SLA garantizado", "Soporte 24/7"],
    featuresEn: ["Everything in Pro", "Multi-location", "Dedicated onboarding", "Guaranteed SLA", "24/7 support"],
    ctaLabelEs: "Contactar", ctaLabelEn: "Contact us", isRecommended: false },
];
