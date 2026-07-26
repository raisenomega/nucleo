import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { CashFlowStatement } from "@accounting/domain/financial-statements.types";

// Formato contable: paréntesis para negativos, secciones de inversión/financiamiento ocultas si total=0.
const paren = (n: number) => (n < 0 ? `(${formatCurrency(Math.abs(n))})` : formatCurrency(n));

export function CashFlowReport({ cf }: { cf: CashFlowStatement }) {
  const { t } = useI18n();
  const line = (label: string, val: number, indent = false, strong = false) => (
    <div className={`flex justify-between py-0.5 ${strong ? "border-t border-border font-bold" : ""} ${indent ? "pl-4" : ""}`}>
      <span className={strong ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={`font-mono ${val < 0 ? "text-destructive" : "text-foreground"}`}>{paren(val)}</span>
    </div>
  );
  const header = (txt: string) => <h3 className="mt-3 font-display text-sm font-bold uppercase text-foreground">{txt}</h3>;
  const cap = (txt: string) => <p className="pl-2 pt-1 text-xs font-bold text-muted-foreground">{txt}</p>;
  return (
    <div className="space-y-1 rounded-xl border border-border bg-card p-4 text-sm md:p-6">
      {header(t("operatingActivities"))}
      {line(t("netIncome"), cf.operating.netIncome)}
      {cf.operating.adjustments.length > 0 && cap(t("nonCashAdjustments"))}
      {cf.operating.adjustments.map((a) => line(a.label, a.amount, true))}
      {cf.operating.workingCapital.length > 0 && cap(t("workingCapitalChanges"))}
      {cf.operating.workingCapital.map((w) => line(`${w.description} ${w.label}`, w.change, true))}
      {line(t("netCashFromOperations"), cf.operating.total, false, true)}
      {cf.investing.total !== 0 && <>{header(t("investingActivities"))}
        {cf.investing.items.map((i) => line(i.label, i.amount, true))}
        {line(t("netCashFromInvesting"), cf.investing.total, false, true)}</>}
      {cf.financing.total !== 0 && <>{header(t("financingActivities"))}
        {cf.financing.items.map((i) => line(i.label, i.amount, true))}
        {line(t("netCashFromFinancing"), cf.financing.total, false, true)}</>}
      <div className="mt-3 space-y-1 border-t-2 border-border pt-2">
        {line(t("netChangeInCash"), cf.summary.netChange, false, true)}
        {line(t("cashBeginning"), cf.summary.cashBeginning)}
        {line(t("cashEnding"), cf.summary.cashEnding, false, true)}
        <p className={`text-right text-xs font-bold ${cf.summary.verification ? "text-green-600" : "text-destructive"}`}>{cf.summary.verification ? `✓ ${t("verified")}` : "✗"}</p>
      </div>
    </div>
  );
}
