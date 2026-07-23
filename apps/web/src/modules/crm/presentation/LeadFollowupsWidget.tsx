import { useEffect, useState } from "react";
import { AlarmClock, Check, ChevronDown, ChevronRight } from "lucide-react";
import { supabaseLeadActivityRepository as repo } from "@crm/infrastructure/supabase-lead-activity.repository";
import type { PendingFollowup } from "@crm/domain/lead-activity.types";

const COLOR: Record<string, string> = { overdue: "text-red-600", today: "text-orange-600", week: "text-muted-foreground" };

// Widget "Seguimientos pendientes": tareas vencidas + hoy + semana. Lo que hace que el CRM se use a diario.
export function LeadFollowupsWidget({ onOpenLead }: { onOpenLead: (id: string) => void }) {
  const [items, setItems] = useState<PendingFollowup[]>([]);
  const [open, setOpen] = useState(false);
  const load = () => void repo.pendingFollowups().then(setItems);
  useEffect(load, []);
  if (items.length === 0) return null;
  const n = (b: string) => items.filter((i) => i.bucket === b).length;
  const complete = async (id: string) => { await repo.complete(id); load(); };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-body font-bold text-foreground">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}<AlarmClock className="h-4 w-4" />Seguimientos</span>
        <span className="flex gap-3 text-sm font-bold">
          {n("overdue") > 0 && <span className="text-red-600">{n("overdue")} vencidas</span>}
          {n("today") > 0 && <span className="text-orange-600">{n("today")} hoy</span>}
          <span className="text-muted-foreground">{n("week")} semana</span></span>
      </button>
      {open && <div className="mt-3 space-y-1">{items.map((i) => (
        <div key={i.activityId} className="flex items-center justify-between gap-2 text-sm">
          <button type="button" onClick={() => onOpenLead(i.leadId)} className="min-w-0 truncate text-left">
            <span className={`font-bold ${COLOR[i.bucket]}`}>{i.dueDate}</span> · {i.contactName}: {i.body}</button>
          <button type="button" onClick={() => void complete(i.activityId)} className="shrink-0 text-green-600" aria-label="Completar"><Check className="h-4 w-4" /></button>
        </div>))}</div>}
    </div>
  );
}
