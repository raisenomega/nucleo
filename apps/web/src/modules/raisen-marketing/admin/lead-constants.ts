import type { LeadStatus } from "@raisen-marketing/data/lead-form.types";

// Estados del lead comercial (labels ES + colores por estado para el inbox /web/leads).
export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "archived"];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo", contacted: "Contactado", qualified: "Calificado", archived: "Archivado",
};
export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  qualified: "bg-green-500/20 text-green-400 border-green-500/30",
  archived: "bg-muted text-muted-foreground border-border",
};
