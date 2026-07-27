import { useState } from "react";
import { FileText } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { usePdfBrand } from "@shared/hooks/usePdfBrand";
import { reportDoc } from "@finance/presentation/pdf/report-doc";
import { ReportDatePicker } from "@shared/components/ReportDatePicker";
import type { ReportBody } from "@shared/pdf/ReportPdf";

// Botón [Generar reporte] + selector de fechas. makeBody arma el body desde las filas de la página.
export function FinanceReportButton({ title, makeBody }: {
  title: string; makeBody: (from: string, to: string) => object;
}) {
  const { t } = useI18n();
  const { exportPdf } = usePdfExport();
  const brand = usePdfBrand();
  const [open, setOpen] = useState(false);
  const gen = (from: string, to: string) => exportPdf(() => reportDoc(makeBody(from, to) as ReportBody, brand));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-body font-bold">
        <FileText className="h-4 w-4" /> {t("generateReport")}</button>
      {open && <ReportDatePicker title={title} onGenerate={gen} onClose={() => setOpen(false)} />}
    </>
  );
}
