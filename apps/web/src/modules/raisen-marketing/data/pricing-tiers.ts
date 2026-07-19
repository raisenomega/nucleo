// 3 tiers de precios (PARTE 7.4). Precios placeholder — editables desde el CMS (S4).
export type Tier = { nameEs: string; nameEn: string; price: number; taglineEs: string; taglineEn: string; featuresEs: string[]; featuresEn: string[]; recommended: boolean };

export const TIERS: Tier[] = [
  { nameEs: "Starter", nameEn: "Starter", price: 49, taglineEs: "Para empezar a digitalizar tu operación", taglineEn: "Start digitalizing your operation",
    featuresEs: ["Hasta 3 módulos", "Facturación y cotizaciones", "Landing white-label", "Soporte por email"],
    featuresEn: ["Up to 3 modules", "Billing and quotes", "White-label landing", "Email support"], recommended: false },
  { nameEs: "Pro", nameEn: "Pro", price: 149, taglineEs: "El favorito de negocios de servicio", taglineEn: "The favorite of service businesses",
    featuresEs: ["Todos los módulos", "Rutas y campo", "Fiscal PR", "Agentes IA", "Soporte prioritario"],
    featuresEn: ["All modules", "Routes & field", "PR tax compliance", "AI agents", "Priority support"], recommended: true },
  { nameEs: "Enterprise", nameEn: "Enterprise", price: 349, taglineEs: "Máximo poder y soporte dedicado", taglineEn: "Maximum power and dedicated support",
    featuresEs: ["Todo de Pro", "Multi-sucursal", "Onboarding dedicado", "SLA garantizado", "Soporte 24/7"],
    featuresEn: ["Everything in Pro", "Multi-location", "Dedicated onboarding", "Guaranteed SLA", "24/7 support"], recommended: false },
];
