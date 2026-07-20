import { Search } from "lucide-react";
import { LEAD_STATUSES, STATUS_LABELS, TEMPERATURES, TEMP_LABELS } from "@raisen-marketing/admin/lead-constants";

export interface LeadFilter { search: string; status: string; temperature: string; leadType: string; showArchived: boolean }
const SEL = "rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Filtros del CRM: búsqueda (nombre/email/empresa) + status + temperatura + tipo + toggle archivados.
export function LeadsFilters({ f, set }: { f: LeadFilter; set: (p: Partial<LeadFilter>) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input className={`${SEL} w-full pl-8`} placeholder="Buscar nombre, email o empresa…" value={f.search} onChange={(e) => set({ search: e.target.value })} />
      </div>
      <select className={SEL} value={f.status} onChange={(e) => set({ status: e.target.value })}><option value="">Todo estado</option>{LEAD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
      <select className={SEL} value={f.temperature} onChange={(e) => set({ temperature: e.target.value })}><option value="">Toda temp.</option>{TEMPERATURES.map((t) => <option key={t} value={t}>{TEMP_LABELS[t]}</option>)}</select>
      <select className={SEL} value={f.leadType} onChange={(e) => set({ leadType: e.target.value })}><option value="">Todo tipo</option><option value="business">Negocio</option><option value="partner">Partner</option></select>
      <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={f.showArchived} onChange={(e) => set({ showArchived: e.target.checked })} />archivados</label>
    </div>
  );
}
