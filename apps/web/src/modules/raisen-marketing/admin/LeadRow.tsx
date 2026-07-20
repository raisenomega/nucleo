import { Eye, Pencil, Mail, MessageCircle, Trash2 } from "lucide-react";
import { BadgeSelect } from "@raisen-marketing/admin/BadgeSelect";
import { LEAD_STATUSES, STATUS_LABELS, STATUS_COLORS, TEMPERATURES, TEMP_LABELS, TEMP_COLORS, waLink } from "@raisen-marketing/admin/lead-constants";
import type { MarketingLead, LeadStatus, LeadTemperature } from "@raisen-marketing/data/lead-form.types";

// Fila del CRM: fecha · nombre/empresa/email · status inline · temperatura inline · ver/editar/email/WhatsApp/eliminar.
export function LeadRow({ lead, onStatus, onTemp, onView, onEdit, onEmail, onDelete }: {
  lead: MarketingLead; onStatus: (s: LeadStatus) => void; onTemp: (t: LeadTemperature) => void;
  onView: () => void; onEdit: () => void; onEmail: () => void; onDelete: () => void;
}) {
  const wa = waLink(lead);
  const btn = "rounded p-1 text-muted-foreground hover:text-foreground";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
      <span className="w-16 shrink-0 text-xs text-muted-foreground">{lead.createdAt.slice(0, 10)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{lead.customerName}{lead.company && <span className="text-muted-foreground"> · {lead.company}</span>}</p>
        <p className="truncate text-xs text-muted-foreground">{lead.customerEmail}</p>
      </div>
      <BadgeSelect value={lead.status} options={LEAD_STATUSES} labels={STATUS_LABELS} colors={STATUS_COLORS} onChange={onStatus} />
      <BadgeSelect value={lead.temperature} options={TEMPERATURES} labels={TEMP_LABELS} colors={TEMP_COLORS} onChange={onTemp} />
      <button type="button" onClick={onView} aria-label="ver" className={btn}><Eye className="h-4 w-4" /></button>
      <button type="button" onClick={onEdit} aria-label="editar" className={btn}><Pencil className="h-4 w-4" /></button>
      <button type="button" onClick={onEmail} aria-label="email" className={btn}><Mail className="h-4 w-4" /></button>
      {wa
        ? <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded p-1 text-green-500"><MessageCircle className="h-4 w-4" /></a>
        : <span className="rounded p-1 text-muted-foreground/30"><MessageCircle className="h-4 w-4" /></span>}
      <button type="button" onClick={onDelete} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
