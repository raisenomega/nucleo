// Constantes SEO de la landing comercial de NÚCLEO (nucleoraisen.com). Fuente única para meta tags, JSON-LD,
// sitemap y llms.txt — si cambia el posicionamiento, se cambia AQUÍ y se propaga a todo.
// Posicionamiento: plataforma de gestión operacional para PYMEs y empresas grandes, cualquier industria.
export const SITE_URL = "https://www.nucleoraisen.com";
export const SITE_NAME = "NÚCLEO by Raisen";
export const LEGAL_NAME = "Raisen Agency LLC";
export const SALES_EMAIL = "ventas@raisen.agency";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
// Verificación de propiedad en Google Search Console (método "etiqueta HTML"). Debe seguir presente DESPUÉS
// de verificar: si se quita, Google revoca la propiedad. Solo se emite en los hosts de Raisen.
export const GOOGLE_SITE_VERIFICATION = "PcvNzr3-5mJxO1XrNxj41nJeM1m0R9UYxBRFbo9QJ9c";

export const SEO_TITLE = "NÚCLEO — Plataforma de gestión operacional para empresas | Puerto Rico y LATAM";
export const SEO_DESCRIPTION =
  "Gestión departamental, facturación, rutas, nómina, fiscal, landing y agentes IA — todo integrado bajo tu marca. " +
  "La plataforma que simplifica operaciones empresariales complejas para PYMEs y empresas grandes.";
export const OG_TITLE = "NÚCLEO — Gestión operacional empresarial simplificada";

// Keywords semánticas — orientan el copy, no son keyword stuffing (Google ignora <meta keywords> desde 2009,
// pero los motores de respuesta sí leen el campo como señal débil de tema).
export const SEO_KEYWORDS = [
  "plataforma de gestión empresarial", "ERP PYME Puerto Rico", "sistema operacional por departamentos",
  "gestión de operaciones", "software empresarial LATAM", "facturación y nómina integrada",
  "plataforma white-label", "gestión departamental", "digitalización empresarial",
  "software de gestión escalable", "automatización de operaciones",
].join(", ");

// Precios vigentes — espejo de los tiers/add-ons ACTIVOS en la DB (migr 214). Si cambian en /web/precios,
// hay que actualizarlos aquí: el JSON-LD y el llms.txt no leen la DB (ver nota en jsonld.org.ts).
export const PRICE_STARTER = "249";
export const PRICE_PRO = "449";
export const PRICE_ENTERPRISE = "649";
export const PRICE_SETUP = "3,500";
export const PRICE_APP_NATIVE = "6,500";
export const PRICE_AGENT_FROM = "99";

// Módulos — usados por llms.txt y por featureList del JSON-LD.
export const MODULES: [string, string][] = [
  ["Facturación inteligente", "cotizaciones → aprobación pública → auto-factura → cobro → PDFs white-label"],
  ["Rutas y operaciones", "paradas asignadas, evidencia fotográfica, completar desde móvil"],
  ["Nómina y talento", "empleados, contratistas, deducciones automáticas, evaluaciones 360°"],
  ["Fiscal PR", "motor de contribución con reglas versionadas, alertas de informativas"],
  ["Landing white-label", "catálogo, SEO, APP nativa bajo dominio del cliente (premium)"],
  ["Agentes IA", "asistentes entrenados en el negocio del cliente (voz, chat, datos reales)"],
  ["Reportes", "4 pilares (ventas, empleados, finanzas, marketing)"],
  ["Gestión documental", "contratos, vencimientos, alertas automáticas"],
  ["Auto-contabilidad", "operaciones → registros financieros sin intervención"],
];
