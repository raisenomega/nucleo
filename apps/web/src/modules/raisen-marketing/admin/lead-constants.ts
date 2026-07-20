import type { LeadStatus, LeadTemperature } from "@raisen-marketing/data/lead-form.types";

// Estados (6) + temperatura (4) del lead comercial: labels ES + colores (badges inline en /web/leads).
export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "converted", "lost", "archived"];
export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo", contacted: "Contactado", qualified: "Calificado", converted: "Convertido", lost: "Perdido", archived: "Archivado",
};
export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  qualified: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  converted: "bg-green-500/20 text-green-400 border-green-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
  archived: "bg-muted text-muted-foreground border-border",
};

export const TEMPERATURES: LeadTemperature[] = ["cold", "warm", "hot", "converted"];
export const TEMP_LABELS: Record<LeadTemperature, string> = { cold: "❄️ Frío", warm: "🌤 Tibio", hot: "🔥 Caliente", converted: "⭐ Convertido" };
export const TEMP_COLORS: Record<LeadTemperature, string> = {
  cold: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  warm: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hot: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  converted: "bg-green-500/20 text-green-400 border-green-500/30",
};

// Click-to-chat wa.me: prioriza whatsapp_phone, si no phone; solo dígitos. null → botón deshabilitado.
export function waLink(l: { whatsappPhone: string | null; customerPhone: string | null }): string | null {
  const d = (l.whatsappPhone || l.customerPhone || "").replace(/\D/g, "");
  return d ? `https://wa.me/${d}` : null;
}
