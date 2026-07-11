import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { SummaryPanel, FiscalStatus } from "@finance/domain/reconciliation.types";

const STATUS: Record<FiscalStatus, { color: string; key: "healthy" | "tight" | "atRisk" }> = {
  healthy: { color: "text-green-600", key: "healthy" },
  tight: { color: "text-yellow-600", key: "tight" },
  at_risk: { color: "text-red-600", key: "atRisk" },
};

export function ReconciliationSummary({ summary }: { summary: SummaryPanel }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const st = STATUS[summary.status];
  const row = (label: string, v: number, neg?: boolean) => (
    <div className="flex justify-between py-0.5"><span className="text-muted-foreground">{label}</span>
      <span>{neg ? "−" : ""}{formatCurrency(Math.abs(v))}</span></div>
  );
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-5">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between font-body font-bold text-foreground">
        <span>{t("executiveSummary")}</span>
        <span className={`flex items-center gap-2 text-sm ${st.color}`}>{formatCurrency(summary.availableBalance)}
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
      </button>
      {open && (
        <>
          <div className="text-sm">
            {row(t("income"), summary.totalIncome)}
            {row(t("fixedExpense"), summary.expenseClasses.fixed, true)}
            {row(t("variableExpense"), summary.expenseClasses.variable, true)}
            {summary.expenseClasses.debt > 0 && row(t("debtExpense"), summary.expenseClasses.debt, true)}
            {summary.expenseClasses.oneTime > 0 && row(t("oneTimeExpense"), summary.expenseClasses.oneTime, true)}
            {summary.expenseClasses.unclassified > 0 && (
              <div className="flex justify-between py-0.5 text-muted-foreground">
                <span>{t("unclassified")} · <span className="text-xs">{t("classifyCategories")}</span></span>
                <span>−{formatCurrency(summary.expenseClasses.unclassified)}</span></div>
            )}
            {row(t("payroll"), summary.totalPayroll, true)}
            {row(t("extraordinary"), summary.totalExtraordinary, true)}
            {row(t("marketing"), summary.totalMarketing, true)}
            <div className="my-1 border-t border-border" />
            {row(t("operatingProfit"), summary.operatingProfit)}
            {row(t("taxObligations"), summary.taxEstimated, true)}
            {row(t("retentionFund"), summary.retentionRequired, true)}
            <div className="my-1 border-t border-border" />
          </div>
          <div className="flex items-end justify-between">
            <span className="font-bold">{t("availableBalance")}</span>
            <span className={`text-2xl font-black ${st.color}`}>{formatCurrency(summary.availableBalance)}</span>
          </div>
          <div className={`text-sm font-bold ${st.color}`}>{t(st.key)}</div>
          <p className="text-xs text-muted-foreground">{t("fiscalDisclaimer")}</p>
        </>
      )}
    </div>
  );
}
