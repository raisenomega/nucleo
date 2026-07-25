import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { useBalanceSheet } from "@accounting/application/useBalanceSheet.hook";
import { supabaseFinancialStatementsRepository } from "@accounting/infrastructure/supabase-financial-statements.repository";
import { BalanceSheetReport } from "@accounting/presentation/BalanceSheetReport";

export function BalanceSheetPage() {
  const { t } = useI18n();
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));
  const { sheet, loading } = useBalanceSheet(supabaseFinancialStatementsRepository, asOf);
  const empty = sheet && sheet.summary.totalAssets === 0 && sheet.summary.totalLiabilities === 0 && sheet.summary.totalEquity === 0;
  const kpi = (label: string, val: string, cls = "") => (
    <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs font-bold text-muted-foreground">{label}</div><p className={`mt-1 font-display text-xl font-bold ${cls}`}>{val}</p></div>
  );
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("balanceSheet")}</h1><p className="text-sm text-muted-foreground">{t("asOfDate")}: {asOf}</p></div>
        <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm" />
      </div>
      {loading ? <p className="text-sm text-muted-foreground">…</p>
        : !sheet || empty ? <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">{t("noDataForPeriod")}</p>
        : <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpi(t("totalAssets"), formatCurrency(sheet.summary.totalAssets), "text-blue-600")}
            {kpi(t("totalLiabilities"), formatCurrency(sheet.summary.totalLiabilities), "text-red-600")}
            {kpi(t("totalEquity"), formatCurrency(sheet.summary.totalEquity), "text-green-600")}
            {kpi(t("liquidityRatio"), sheet.liabCurrentTotal !== 0 ? (sheet.assetsCurrentTotal / sheet.liabCurrentTotal).toFixed(2) : "—", "text-teal-600")}
          </div>
          {sheet.summary.totalAssets !== 0 && <p className="text-xs text-muted-foreground">{t("debtRatio")}: {(sheet.summary.totalLiabilities / sheet.summary.totalAssets * 100).toFixed(1)}%</p>}
          <BalanceSheetReport bs={sheet} />
        </>}
    </div>
  );
}
