import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { PayrollCalc, WorkerType } from "@finance/domain/payroll.types";

export function PayrollDeductionPreview({ calc, workerType }: { calc: PayrollCalc; workerType: WorkerType }) {
  const { t } = useI18n();
  const emp = workerType === "employee";
  const row = (label: string, v: number, neg?: boolean, cls?: string) => (
    <div className={`flex justify-between ${cls ?? ""}`}><span className="text-muted-foreground">{label}</span>
      <span>{neg ? "−" : ""}{formatCurrency(Math.abs(v))}</span></div>
  );
  return (
    <div className="space-y-1 rounded-lg border border-border bg-secondary/40 p-4 text-sm">
      <div className="text-xs font-bold text-muted-foreground">{t("employeeDeductions")}</div>
      {calc.employeeDeductions.map((d) => row(`${d.label} ${d.rate}%`, d.amount, true))}
      {row(t("totalWithheld"), calc.totalEmployeeDeductions, true, "border-t border-border pt-1 font-bold")}
      {row(emp ? t("netSalary") : t("contractorReceives"), calc.netSalary, false, "font-bold text-primary")}
      {emp ? (
        <>
          <div className="pt-2 text-xs font-bold text-muted-foreground">{t("employerContributions")}</div>
          {calc.employerContributions.map((d) => row(`${d.label} ${d.rate}%`, d.amount))}
          {row(t("totalEmployerCost"), calc.totalEmployerCost, false, "border-t border-border pt-1 font-bold text-primary")}
        </>
      ) : row(t("remitToTreasury"), calc.totalEmployeeDeductions, false, "font-bold")}
      <p className="pt-2 text-xs text-muted-foreground">{t("payrollDisclaimer")}</p>
    </div>
  );
}
