// 2 bloques de "Soluciones" (audience business/partner → pre-marca la pill del lead form).
export type Audience = "business" | "partner";
export type Solution = { audience: Audience; eyebrowEs: string; eyebrowEn: string; titleEs: string; titleEn: string; subtitleEs: string; subtitleEn: string; bulletsEs: string[]; bulletsEn: string[]; ctaEs: string; ctaEn: string };

export const SOLUTIONS: Solution[] = [
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
