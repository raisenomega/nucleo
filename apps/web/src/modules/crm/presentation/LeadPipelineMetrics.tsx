import { formatCurrency } from "@shared/lib/format";
import type { Lead } from "@crm/domain/lead.types";

// Probabilidad por etapa (constante, no columna) para el pipeline ponderado.
const PROB: Record<string, number> = { new: 0.1, contacted: 0.3, quoted: 0.6 };
const ACTIVE = ["new", "contacted", "quoted"];

export function LeadPipelineMetrics({ leads }: { leads: Lead[] }) {
  const active = leads.filter((l) => ACTIVE.includes(l.status));
  const activeVal = active.reduce((s, l) => s + l.quotedPrice, 0);
  const converted = leads.filter((l) => l.status === "converted");
  const convVal = converted.reduce((s, l) => s + l.quotedPrice, 0);
  const rate = leads.length ? Math.round((converted.length / leads.length) * 100) : 0;
  const weighted = active.reduce((s, l) => s + l.quotedPrice * (PROB[l.status] ?? 0), 0);
  const cell = (label: string, main: string, sub?: string) => (
    <div className="rounded-lg border border-border bg-card p-2 text-center">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="font-bold text-foreground">{main}</p>{sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
  return (
    <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
      {cell("Pipeline activo", `${active.length} leads`, formatCurrency(activeVal))}
      {cell("Convertidos", `${converted.length}`, formatCurrency(convVal))}
      {cell("Conversión", `${rate}%`)}
      {cell("Ponderado", formatCurrency(weighted), "prob. por etapa")}
    </div>
  );
}
