import { useDroppable } from "@dnd-kit/core";
import { formatCurrency } from "@shared/lib/format";
import { KanbanCard } from "@crm/presentation/KanbanCard";
import type { Lead } from "@crm/domain/lead.types";
import type { LeadCardMeta } from "@crm/domain/lead-activity.types";

// Columna del Kanban = drop target (id = status). Header con contador + suma de quoted_price de la etapa.
export function KanbanColumn({ status, label, color, leads, metaMap, terminal, onCardClick, onMove }: {
  status: string; label: string; color: string; leads: Lead[]; metaMap: Record<string, LeadCardMeta>;
  terminal?: boolean; onCardClick: (id: string) => void; onMove: (lead: Lead, status: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const sum = leads.reduce((s, l) => s + l.quotedPrice, 0);
  return (
    <div ref={setNodeRef} className={`flex min-w-[220px] flex-1 flex-col gap-2 rounded-xl border border-border p-2 ${terminal ? "bg-secondary/40" : "bg-card"} ${isOver ? "ring-2 ring-primary" : ""}`}>
      <div className="flex items-center justify-between px-1">
        <span className={`rounded px-2 py-0.5 text-xs font-bold ${color}`}>{label} · {leads.length}</span>
        <span className="text-xs font-bold text-muted-foreground">{formatCurrency(sum)}</span>
      </div>
      <div className="flex flex-col gap-2">{leads.map((l) => (
        <KanbanCard key={l.id} lead={l} meta={metaMap[l.id]} onClick={() => onCardClick(l.id)} onMove={(s) => onMove(l, s)} />))}</div>
    </div>
  );
}
