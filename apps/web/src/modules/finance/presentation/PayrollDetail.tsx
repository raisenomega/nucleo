import { useEffect, useState } from "react";
import { PhotoLightbox } from "@shared/components/PhotoLightbox";
import { X, FileDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { usePdf } from "@shared/hooks/usePdf";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import type { Payroll } from "@finance/domain/payroll.types";

export function PayrollDetail({ item, onClose }: { item: Payroll; onClose: () => void }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const pdf = usePdf();
  const [urls, setUrls] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => { void signEvidence(item.evidenceUrls).then(setUrls); }, [item]);
  const row = (k: "date" | "employee" | "period" | "amount" | "paymentMethod" | "notes", v: string) => (
    <div><dt className="inline text-muted-foreground">{t(k)}: </dt><dd className="inline">{v}</dd></div>
  );
  return (
    <>
      <ScreenModal onClose={onClose}>
        <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
          <h2 className="font-display text-xl font-bold text-primary">{t("payrollDetail")}</h2>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
        </div>
        <div className="space-y-3 p-4 md:p-6">
          <dl className="space-y-1 font-body text-sm">
            {row("date", item.date)}{row("employee", item.employeeName)}{row("period", item.period)}
            {row("amount", formatCurrency(item.amount))}{row("paymentMethod", item.paymentMethodLabel)}
            {row("notes", item.notes)}
          </dl>
          {can("payroll", "salary") && item.deductionsEmployee.length > 0 && (
            <div className="space-y-1 border-t border-border pt-2 text-sm">
              <div className="text-xs font-bold text-muted-foreground">{t("employeeDeductions")}</div>
              {item.deductionsEmployee.map((d) => (
                <div key={d.label} className="flex justify-between"><span className="text-muted-foreground">{d.label} {d.rate}%</span><span>−{formatCurrency(d.amount)}</span></div>
              ))}
              <div className="flex justify-between font-bold text-primary"><span>{t("netSalary")}</span><span>{formatCurrency(item.netSalary)}</span></div>
              {item.contributionsEmployer.map((d) => (
                <div key={d.label} className="flex justify-between text-muted-foreground"><span>{d.label} {d.rate}%</span><span>{formatCurrency(d.amount)}</span></div>
              ))}
              <div className="flex justify-between font-bold text-primary"><span>{t("totalEmployerCost")}</span><span>{formatCurrency(item.totalEmployerCost)}</span></div>
            </div>
          )}
          {urls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {urls.map((src, i) => <img key={i} src={src} alt="" onClick={() => setPhoto(src)} className="h-24 w-24 cursor-pointer rounded object-cover" />)}
            </div>
          )}
          {can("payroll", "salary") && (
            <button type="button" disabled={pdf.generating} onClick={() => void pdf.generatePdf("payroll", item.id)}
              className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold disabled:opacity-50">
              <FileDown className="h-4 w-4" /> {pdf.generating ? t("generatingPdf") : t("payslipPdf")}</button>
          )}
        </div>
      </ScreenModal>
      {photo && <PhotoLightbox src={photo} onClose={() => setPhoto(null)} />}
    </>
  );
}
