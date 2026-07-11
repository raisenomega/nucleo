import type { ReactNode } from "react";
import { ReportLegend } from "@finance/presentation/ReportLegend";

// Card de reporte: título + gráfica/tabla + leyenda. El export PDF vive a nivel de tab (usePdf).
export function ReportChart({ title, legend, children }: { title: string; legend?: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h3 className="font-body font-bold text-foreground">{title}</h3>
      {children}
      {legend && <ReportLegend text={legend} />}
    </div>
  );
}
