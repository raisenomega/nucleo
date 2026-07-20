import { Eye, Trash2 } from "lucide-react";
import { LEAD_STATUSES, STATUS_LABELS, STATUS_COLORS } from "@raisen-marketing/admin/lead-constants";
import type { MarketingLead, LeadStatus } from "@raisen-marketing/data/lead-form.types";

// Fila de un lead en el inbox: fecha · nombre/email · tipo · select de status inline · ver detalle · eliminar.
export function LeadRow({ lead, onStatus, onView, onDelete }: {
  lead: MarketingLead; onStatus: (s: LeadStatus) => void; onView: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <span className="w-16 shrink-0 text-xs text-muted-foreground">{lead.createdAt.slice(0, 10)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{lead.customerName}</p>
        <p className="truncate text-xs text-muted-foreground">{lead.customerEmail}</p>
      </div>
      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{lead.leadType === "business" ? "negocio" : "partner"}</span>
      <select value={lead.status} onChange={(e) => onStatus(e.target.value as LeadStatus)} className={`shrink-0 rounded-full border px-2 py-1 text-xs ${STATUS_COLORS[lead.status]}`}>
        {LEAD_STATUSES.map((s) => <option key={s} value={s} className="bg-card text-foreground">{STATUS_LABELS[s]}</option>)}
      </select>
      <button type="button" onClick={onView} aria-label="ver" className="rounded p-1 text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></button>
      <button type="button" onClick={onDelete} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
