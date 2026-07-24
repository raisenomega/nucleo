import { ChevronDown } from "lucide-react";

interface Props { visits: number; leads: number; demos: number; visitToLead: number; leadToDemo: number }

// Ola 2.8c · embudo comercial visual: Visitas → Leads → Demos, con la tasa de conversión entre cada etapa.
// Es lo que dice si la landing convierte o no: un embudo que se estrecha demasiado rápido = fuga de tráfico.
export function PlatformFunnel({ visits, leads, demos, visitToLead, leadToDemo }: Props) {
  const stage = (label: string, n: number, w: string) => (
    <div className={`mx-auto ${w} rounded-lg border border-border bg-secondary/40 py-3 text-center`}>
      <p className="text-2xl font-bold text-foreground">{n.toLocaleString()}</p>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
    </div>
  );
  const rate = (pct: number) => (
    <div className="flex items-center justify-center gap-1 py-1 text-xs font-bold text-primary"><ChevronDown className="h-3 w-3" />{pct}%</div>
  );
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-3 text-sm font-bold text-foreground">Embudo comercial</p>
      {stage("Visitas", visits, "w-full max-w-md")}
      {rate(visitToLead)}
      {stage("Leads", leads, "w-3/4 max-w-sm")}
      {rate(leadToDemo)}
      {stage("Demos agendadas", demos, "w-1/2 max-w-xs")}
    </div>
  );
}
