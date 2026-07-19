import { FileText, Route, BarChart3, Bot, type LucideIcon } from "lucide-react";

// 4 features del grid de servicios (Facturación/Rutas/Fiscal/IA). icon = componente Lucide directo.
export type Feature = { icon: LucideIcon; titleEs: string; titleEn: string; descEs: string; descEn: string; benefitsEs: string[]; benefitsEn: string[] };

export const FEATURES: Feature[] = [
  { icon: FileText, titleEs: "Facturación inteligente", titleEn: "Smart billing",
    descEs: "Cotizaciones → facturas → cobro, con aprobación pública y PDFs bajo tu marca.", descEn: "Quotes → invoices → collection, with public approval and PDFs under your brand.",
    benefitsEs: ["Aprobación pública del cliente", "Auto-facturación", "PDFs profesionales"], benefitsEn: ["Public client approval", "Auto-invoicing", "Professional PDFs"] },
  { icon: Route, titleEs: "Rutas y campo", titleEn: "Routes & field",
    descEs: "Paradas asignadas, evidencia fotográfica y servicios completados desde el móvil.", descEn: "Assigned stops, photo evidence and services completed from mobile.",
    benefitsEs: ["Paradas asignadas", "Evidencia antes/después", "Completar desde el móvil"], benefitsEn: ["Assigned stops", "Before/after evidence", "Complete from mobile"] },
  { icon: BarChart3, titleEs: "Fiscal Puerto Rico", titleEn: "PR tax compliance",
    descEs: "Motor de contribución con reglas versionadas, alertas de informativas y optimización.", descEn: "Tax engine with versioned rules, filing alerts and optimization.",
    benefitsEs: ["Reglas versionadas", "Alertas de informativas", "Optimización fiscal"], benefitsEn: ["Versioned rules", "Filing alerts", "Tax optimization"] },
  { icon: Bot, titleEs: "Agentes IA", titleEn: "AI agents",
    descEs: "Asistentes entrenados en tu negocio, integrados con voz, chat y tus datos reales.", descEn: "Assistants trained on your business, integrated with voice, chat and your real data.",
    benefitsEs: ["Voz y chat", "Entrenados en tu negocio", "Datos reales"], benefitsEn: ["Voice and chat", "Trained on your business", "Real data"] },
];
