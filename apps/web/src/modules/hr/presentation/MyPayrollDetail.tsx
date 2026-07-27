import { FileDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdf } from "@shared/hooks/usePdf";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { MyPayStub } from "@hr/domain/portal.types";

// Desglose de un recibo. Los aportes patronales (total_employer_cost) NO se piden ni se muestran en el portal.
export function MyPayrollDetail({ stub, onClose }: { stub: MyPayStub; onClose: () => void }) {
  const { t } = useI18n();
  const pdf = usePdf();
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
          <button type="button" disabled={pdf.generating} onClick={() => void pdf.generatePdf("payroll", stub.id)} className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-bold disabled:opacity-50">
            <FileDown className="h-4 w-4" /> {pdf.generating ? t("generatingPdf") : t("downloadPayStub")}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("close")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
