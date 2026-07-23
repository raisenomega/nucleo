import { useDraggable } from "@dnd-kit/core";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { relativeTime } from "@shared/notifications/notif-format";
import { TempBadge } from "@crm/presentation/LeadBadges";
import { STATUSES } from "@crm/presentation/lead.constants";
import type { Lead } from "@crm/domain/lead.types";
import type { LeadCardMeta } from "@crm/domain/lead-activity.types";

const KL: Record<string, string> = { call: "Llamada", email: "Email", note: "Nota", task: "Tarea", meeting: "Reunión", whatsapp: "WhatsApp" };

// Card del Kanban: draggable (dnd-kit) + dropdown de status como fallback accesible/mobile. Click abre el detalle.
export function KanbanCard({ lead, meta, onClick, onMove }: {
  lead: Lead; meta?: LeadCardMeta; onClick: () => void; onMove: (status: string) => void;
}) {
  const { t, locale } = useI18n();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const overdue = meta?.nextTaskDue && meta.nextTaskDue < new Date().toISOString().slice(0, 10);
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} onClick={onClick} style={style}
      className={`cursor-grab space-y-1 rounded-lg border border-border bg-background p-2 text-sm shadow-sm ${isDragging ? "opacity-60 ring-2 ring-primary" : ""}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="min-w-0 truncate font-bold text-foreground">{lead.contactName}</span><TempBadge value={lead.temperature} />
      </div>
      {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
      <p className="truncate text-xs text-muted-foreground">{lead.serviceTypeLabel || lead.serviceRequested || "—"}</p>
      {lead.quotedPrice > 0 && <p className="font-bold text-foreground">{formatCurrency(lead.quotedPrice)}</p>}
      {meta?.lastAt && <p className="text-[11px] text-muted-foreground">{meta.lastKind ? KL[meta.lastKind] : ""} · {relativeTime(meta.lastAt, locale)}</p>}
      {meta?.nextTaskDue && <p className={`text-[11px] font-bold ${overdue ? "text-red-600" : "text-orange-600"}`}>Tarea: {meta.nextTaskDue}</p>}
      <select value={lead.status} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onChange={(e) => onMove(e.target.value)}
        className="w-full rounded border border-border bg-secondary p-1 text-[11px]">{STATUSES.map((s) => <option key={s.value} value={s.value}>{t(s.key)}</option>)}</select>
    </div>
  );
}
