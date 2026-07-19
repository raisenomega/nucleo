// Datos hardcodeados (Sesión 1) de las 6 features del bento grid — PARTE 7.2 del documento maestro.
// `icon` = nombre Lucide; `colSpan` 2 en índices 0 y 3 (cards anchas), 1 en el resto.
export type MarketingFeature = { icon: string; titleEs: string; descriptionEs: string; colSpan: 1 | 2 };

export const FEATURES: MarketingFeature[] = [
  { icon: "FileText", titleEs: "Facturación inteligente", descriptionEs: "Cotizaciones → facturas → cobro. Flujo completo con aprobación pública, auto-facturación y PDFs profesionales bajo tu marca.", colSpan: 2 },
  { icon: "Route", titleEs: "Rutas y campo", descriptionEs: "Asigna paradas, captura evidencia fotográfica, completa servicios desde el móvil. Control total de operaciones en campo.", colSpan: 1 },
  { icon: "Bot", titleEs: "Agentes IA", descriptionEs: "Asistentes entrenados en tu negocio que responden, sugieren y automatizan — integrados con voz, chat y tus datos reales.", colSpan: 1 },
  { icon: "BarChart3", titleEs: "Fiscal PR", descriptionEs: "Motor de contribución con reglas versionadas, alertas de informativas y estrategias de optimización fiscal adaptadas a Puerto Rico.", colSpan: 2 },
  { icon: "Globe", titleEs: "Landing white-label", descriptionEs: "Tu cliente ve TU marca. Catálogo, cotizaciones, contacto — todo bajo tu dominio con SEO y PWA incluidos.", colSpan: 1 },
  { icon: "Users", titleEs: "Nómina y equipo", descriptionEs: "Empleados, contratistas, deducciones automáticas, evaluaciones y capacitación — gestión de talento completa.", colSpan: 1 },
];
