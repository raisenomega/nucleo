import { LEAD_STATUSES, STATUS_LABELS } from "@raisen-marketing/admin/lead-constants";
import type { MarketingLead } from "@raisen-marketing/data/lead-form.types";

// Métricas del CRM: conteo por cada status (sobre TODOS los leads cargados, no los filtrados). Réplica de
// LeadsStats de OMEGA (extendido a 6 estados).
export function LeadsStats({ leads }: { leads: MarketingLead[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {LEAD_STATUSES.map((s) => (
        <div key={s} className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{leads.filter((l) => l.status === s).length}</p>
          <p className="text-xs text-muted-foreground">{STATUS_LABELS[s]}</p>
        </div>
      ))}
    </div>
  );
}
