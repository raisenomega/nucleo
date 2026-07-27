import { FileDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { usePdfBrand } from "@shared/hooks/usePdfBrand";
import { payslipDoc } from "@finance/presentation/pdf/finance-pdf-docs";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { MyPayStub } from "@hr/domain/portal.types";

// Desglose de un recibo. PDF client-side (RLS payroll self) → sin el 403 del pdf-api (roles ceo/coo).
export function MyPayrollDetail({ stub, employeeName, onClose }: { stub: MyPayStub; employeeName: string; onClose: () => void }) {
  const { t } = useI18n();
  const { generating, exportPdf } = usePdfExport();
  const brand = usePdfBrand();
  const slip = () => payslipDoc({ employeeName, period: stub.period, grossSalary: stub.gross, netSalary: stub.net, deductions: stub.deductions.map((d) => ({ label: d.label, amount: d.amount })), hoursRegular: stub.hoursRegular, hoursOvertime: stub.hoursOvertime }, brand, t);
  const money = (n: number) => `$${n.toFixed(2)}`;
  const totalDed = stub.deductions.reduce((s, d) => s + d.amount, 0);
  const row = (label: string, val: string, bold?: boolean) => (
    <div className={`flex justify-between py-1 text-sm ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}><span>{label}</span><span>{val}</span></div>);
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("payStub")} · {stub.period} · {stub.date}</h2>
        <div className="rounded-xl border border-border bg-card p-4">
          {row(t("grossSalary"), money(stub.gross), true)}
          {stub.hoursRegular != null && row(t("regularHours"), `${stub.hoursRegular} h`)}
          {stub.hoursOvertime ? row(t("overtimeHours"), `${stub.hoursOvertime} h`) : null}
          <div className="my-2 border-t border-border" />
          {stub.deductions.map((d, i) => <div key={i}>{row(d.label, `- ${money(d.amount)}`)}</div>)}
          {row(t("deductions"), `- ${money(totalDed)}`, true)}
          <div className="my-2 border-t border-border" />
          {row(t("netSalary"), money(stub.net), true)}
        </div>
        <div className="flex justify-between">
          <button type="button" disabled={generating} onClick={() => void exportPdf(slip)} className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-bold disabled:opacity-50">
            <FileDown className="h-4 w-4" /> {generating ? t("generatingPdf") : t("downloadPayStub")}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("close")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
