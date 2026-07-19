// Bloques de "Soluciones" (audience business/partner → pre-marca la pill del lead form). `highlight` destaca
// el card (borde/glow dorado + badge), reservado para el agente contable multi-país.
export type Audience = "business" | "partner";
export type Solution = { audience: Audience; highlight?: boolean; eyebrowEs: string; eyebrowEn: string; titleEs: string; titleEn: string; subtitleEs: string; subtitleEn: string; bulletsEs: string[]; bulletsEn: string[]; ctaEs: string; ctaEn: string };

export const SOLUTIONS: Solution[] = [
  { audience: "business", highlight: true, eyebrowEs: "Agente contable IA", eyebrowEn: "AI accountant",
    titleEs: "Contabilidad que cumple en PR, México y Colombia", titleEn: "Accounting compliant in PR, Mexico and Colombia",
    subtitleEs: "Un agente entrenado en las reglas fiscales de cada país: registra, concilia y te avisa antes de cada vencimiento.", subtitleEn: "An agent trained on each country's tax rules: it records, reconciles and alerts you before every deadline.",
    bulletsEs: ["Reglas fiscales de PR, México y Colombia", "Informativas y deducciones automáticas", "Concilia y alerta antes de vencer"], bulletsEn: ["Tax rules for PR, Mexico and Colombia", "Automatic filings and deductions", "Reconciles and alerts before deadlines"],
    ctaEs: "Solicitar acceso", ctaEn: "Request access" },
  { audience: "business", eyebrowEs: "Plataforma completa", eyebrowEn: "Full platform",
    titleEs: "Un solo sistema para toda tu operación", titleEn: "One system for your whole operation",
    subtitleEs: "Más allá de facturación y rutas: nómina, reportes, documentos y tu propia landing white-label.", subtitleEn: "Beyond billing and routes: payroll, reports, documents and your own white-label landing.",
    bulletsEs: ["Nómina y equipo con deducciones", "Reportes y analytics de 4 pilares", "Documentos, contratos y landing propia"], bulletsEn: ["Payroll and team with deductions", "4-pillar reports and analytics", "Documents, contracts and your own landing"],
    ctaEs: "Solicitar acceso", ctaEn: "Request access" },
  { audience: "business", eyebrowEs: "Para tu negocio", eyebrowEn: "For your business",
    titleEs: "Opera todo bajo tu propia marca", titleEn: "Run everything under your own brand",
    subtitleEs: "Facturación, rutas, equipo, fiscal y landing — un solo sistema en tu dominio.", subtitleEn: "Billing, routes, team, taxes and landing — one system on your domain.",
    bulletsEs: ["Panel completo white-label", "Landing y catálogo propios", "Cumplimiento fiscal de PR"], bulletsEn: ["Full white-label dashboard", "Your own landing and catalog", "PR tax compliance"],
    ctaEs: "Solicitar acceso", ctaEn: "Request access" },
  { audience: "partner", eyebrowEs: "Para agencias y partners", eyebrowEn: "For agencies and partners",
    titleEs: "Revende NÚCLEO como tu producto", titleEn: "Resell NÚCLEO as your product",
    subtitleEs: "Ofrece la plataforma a tus clientes bajo tu agencia, con tu marca y tu margen.", subtitleEn: "Offer the platform to your clients under your agency, your brand and your margin.",
    bulletsEs: ["Multi-tenant bajo tu agencia", "Marca y dominio por cliente", "Margen recurrente"], bulletsEn: ["Multi-tenant under your agency", "Brand and domain per client", "Recurring margin"],
    ctaEs: "Quiero ser partner", ctaEn: "I want to be a partner" },
];
