// Mapa de lead_source (texto crudo) → label legible. Reusable en lista + detalle. Fallback para '{slug}-request'.
export interface LeadSourceMeta { labelEs: string; labelEn: string }
export const LEAD_SOURCE_LABELS: Record<string, LeadSourceMeta> = {
  "web-landing": { labelEs: "Landing web", labelEn: "Web landing" },
  "hydro-jet-request": { labelEs: "Hydro-Jet", labelEn: "Hydro-Jet" },
  "order-web": { labelEs: "Pedido web", labelEn: "Web order" },
};

export function leadSourceLabel(source: string, en: boolean, fallback?: string): string {
  const m = LEAD_SOURCE_LABELS[source];
  if (m) return en ? m.labelEn : m.labelEs;
  if (source?.endsWith("-request")) return source.replace(/-request$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return fallback || source || "—";
}
