import type { SolutionRow, SolutionsConfig, PillPreset } from "@raisen-marketing/data/solution.types";

// `Audience` = pill del lead form (business/partner). Se re-exporta aquí para MarketingRoot/MarketingLeadForm.
export type Audience = PillPreset;

// Fallback de la sección Soluciones (idéntico al seed de la migr 202). La landing lo usa hasta que la DB
// responde, o si no hay bloques activos. Así la landing nunca queda vacía si Supabase falla.
export const SOLUTIONS_CONFIG_FALLBACK: SolutionsConfig = {
  id: "", eyebrowEs: "Soluciones", eyebrowEn: "Solutions",
  titleEs: "Soluciones que escalan contigo", titleEn: "Solutions that scale with you",
};

const base = { ctaHref: "#lead-form", isActive: true };

export const SOLUTIONS_FALLBACK: SolutionRow[] = [
  { ...base, id: "f1", iconName: "Calculator", titleEs: "Agente contable IA", titleEn: "AI accountant", descEs: "Un agente entrenado en las reglas fiscales de PR, México y Colombia: registra, concilia y te avisa antes de cada vencimiento.", descEn: "An agent trained on the tax rules of PR, Mexico and Colombia: it records, reconciles and alerts you before every deadline.", bulletsEs: ["Reglas fiscales de PR, México y Colombia", "Informativas y deducciones automáticas", "Concilia y alerta antes de vencer"], bulletsEn: ["Tax rules for PR, Mexico and Colombia", "Automatic filings and deductions", "Reconciles and alerts before deadlines"], ctaLabelEs: "Conocer más", ctaLabelEn: "Learn more", pillPreset: null, isHighlighted: true, badgeEs: "Destacado", badgeEn: "Featured", displayOrder: 1 },
  { ...base, id: "f2", iconName: "LayoutGrid", titleEs: "Plataforma completa", titleEn: "Full platform", descEs: "Un solo sistema para toda tu operación: nómina, reportes, documentos y tu propia landing white-label.", descEn: "One system for your whole operation: payroll, reports, documents and your own white-label landing.", bulletsEs: ["Nómina y equipo con deducciones", "Reportes y analytics de 4 pilares", "Documentos, contratos y landing propia"], bulletsEn: ["Payroll and team with deductions", "4-pillar reports and analytics", "Documents, contracts and your own landing"], ctaLabelEs: "Ver módulos", ctaLabelEn: "See modules", pillPreset: null, isHighlighted: false, badgeEs: null, badgeEn: null, displayOrder: 2 },
  { ...base, id: "f3", iconName: "Building2", titleEs: "Para tu negocio", titleEn: "For your business", descEs: "Opera todo bajo tu propia marca: facturación, rutas, equipo y fiscal en un solo sistema, en tu dominio.", descEn: "Run everything under your own brand: billing, routes, team and taxes in one system, on your domain.", bulletsEs: ["Opera bajo tu marca", "Todos los módulos incluidos", "Soporte directo"], bulletsEn: ["Run under your brand", "All modules included", "Direct support"], ctaLabelEs: "Solicitar acceso", ctaLabelEn: "Request access", pillPreset: "business", isHighlighted: false, badgeEs: null, badgeEn: null, displayOrder: 3 },
  { ...base, id: "f4", iconName: "Handshake", titleEs: "Para agencias y partners", titleEn: "For agencies and partners", descEs: "Revende NÚCLEO como tu producto: ofrece la plataforma a tus clientes bajo tu marca y tu margen.", descEn: "Resell NÚCLEO as your product: offer the platform to your clients under your brand and your margin.", bulletsEs: ["Revende como tu producto", "Panel multi-tenant", "Comisiones recurrentes"], bulletsEn: ["Resell as your product", "Multi-tenant dashboard", "Recurring commissions"], ctaLabelEs: "Ser partner", ctaLabelEn: "Become a partner", pillPreset: "partner", isHighlighted: false, badgeEs: null, badgeEn: null, displayOrder: 4 },
];
