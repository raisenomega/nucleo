import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ReportLegend } from "@finance/presentation/ReportLegend";

// Card de reporte: título + gráfica/tabla + leyenda + exportar PDF (placeholder Gotenberg).
export function ReportChart({ title, legend, children }: { title: string; legend?: string; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-body font-bold text-primary">{title}</h3>
        <button type="button" onClick={() => window.alert(t("pdfSoon"))} title={t("pdfSoon")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><FileText className="h-4 w-4" /> PDF</button>
      </div>
      {children}
      {legend && <ReportLegend text={legend} />}
    </div>
  );
}
