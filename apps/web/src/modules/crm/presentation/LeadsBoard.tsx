import { useState } from "react";
import { Table, LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LeadTable } from "@crm/presentation/LeadTable";
import { LeadKanban } from "@crm/presentation/LeadKanban";
import type { Lead } from "@crm/domain/lead.types";

// Vista DUAL de /leads: toggle Tabla | Pipeline. La tabla se conserva intacta (búsqueda/bulk); el Kanban se suma.
export function LeadsBoard({ leads, onView, onEdit, onDelete, onMove }: {
  leads: Lead[]; onView: (id: string) => void; onEdit?: (id: string) => void;
  onDelete?: (id: string) => void; onMove: (lead: Lead, status: string) => void;
}) {
  const [view, setView] = useState<"table" | "kanban">("table");
  const tab = (v: "table" | "kanban", Icon: LucideIcon, label: string) => (
    <button type="button" onClick={() => setView(v)}
      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold ${view === v ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
      <Icon className="h-4 w-4" />{label}</button>
  );
  return (
    <div className="space-y-3">
      <div className="flex gap-2">{tab("table", Table, "Tabla")}{tab("kanban", LayoutGrid, "Pipeline")}</div>
      {view === "table"
        ? <LeadTable rows={leads} onView={onView} onEdit={onEdit} onDelete={onDelete} />
        : <LeadKanban leads={leads} onCardClick={onView} onMove={onMove} />}
    </div>
  );
}
