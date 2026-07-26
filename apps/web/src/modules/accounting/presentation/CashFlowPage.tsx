import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { useCashFlow } from "@accounting/application/useCashFlow.hook";
import { supabaseFinancialStatementsRepository } from "@accounting/infrastructure/supabase-financial-statements.repository";
import { CashFlowReport } from "@accounting/presentation/CashFlowReport";
import type { StatementFilters } from "@accounting/domain/financial-statements.types";

const M = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export function CashFlowPage() {
  const { t } = useI18n();
  const [f, setF] = useState<StatementFilters>(() => { const d = new Date(); return { year: d.getFullYear(), monthFrom: 1, monthTo: d.getMonth() + 1 }; });
  const { cashFlow, loading } = useCashFlow(supabaseFinancialStatementsRepository, f);
  const upd = (p: Partial<StatementFilters>) => setF((s) => ({ ...s, ...p }));
  const sm = cashFlow?.summary;
  const empty = cashFlow && cashFlow.summary.cashBeginning === 0 && cashFlow.summary.cashEnding === 0 && cashFlow.operating.netIncome === 0;
  const sel = "rounded-lg border border-border bg-background p-2 text-sm", qb = "rounded-lg bg-secondary px-3 py-2 text-xs font-bold";
  const period = `${String(f.monthFrom).padStart(2, "0")}–${String(f.monthTo).padStart(2, "0")}/${f.year}`;
  const kpi = (label: string, val: string, cls = "") => (
    <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs font-bold text-muted-foreground">{label}</div><p className={`mt-1 font-display text-xl font-bold ${cls}`}>{val}</p></div>
  );
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div><h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("cashFlowStatement")}</h1><p className="text-sm text-muted-foreground">{period}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={f.year} onChange={(e) => upd({ year: +e.target.value })} className={sel}>{[f.year + 1, f.year, f.year - 1, f.year - 2].filter((y, i, a) => a.indexOf(y) === i).map((y) => <option key={y} value={y}>{y}</option>)}</select>
        <select value={f.monthFrom} onChange={(e) => upd({ monthFrom: +e.target.value })} className={sel}>{M.map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}</select>
        <span className="text-muted-foreground">–</span>
        <select value={f.monthTo} onChange={(e) => upd({ monthTo: +e.target.value })} className={sel}>{M.map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}</select>
        <button type="button" onClick={() => upd({ monthFrom: 1, monthTo: 12 })} className={qb}>{t("fullYear")}</button>
        <button type="button" onClick={() => upd({ monthFrom: 1, monthTo: new Date().getMonth() + 1 })} className={qb}>{t("yearToDate")}</button>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">…</p>
        : !sm || empty ? <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">{t("noDataForPeriod")}</p>
        : <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpi(t("cashBeginning"), formatCurrency(sm.cashBeginning))}
            {kpi(t("netChangeInCash"), formatCurrency(sm.netChange), sm.netChange < 0 ? "text-destructive" : "text-green-600")}
            {kpi(t("cashEnding"), formatCurrency(sm.cashEnding), "text-blue-600")}
            {kpi(t("netCashFromOperations"), formatCurrency(cashFlow.operating.total), cashFlow.operating.total < 0 ? "text-destructive" : "text-green-600")}
          </div>
          <CashFlowReport cf={cashFlow} />
        </>}
    </div>
  );
}
