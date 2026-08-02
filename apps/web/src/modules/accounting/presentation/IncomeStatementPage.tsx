import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { stmtErr } from "@accounting/presentation/statement-error";
import { formatCurrency } from "@shared/lib/format";
import { useFinancialStatements } from "@accounting/application/useFinancialStatements.hook";
import { supabaseFinancialStatementsRepository } from "@accounting/infrastructure/supabase-financial-statements.repository";
import { IncomeStatementReport } from "@accounting/presentation/IncomeStatementReport";
import type { StatementFilters } from "@accounting/domain/financial-statements.types";

const M = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export function IncomeStatementPage() {
  const { t } = useI18n();
  const [f, setF] = useState<StatementFilters>(() => { const d = new Date(); return { year: d.getFullYear(), monthFrom: d.getMonth() + 1, monthTo: d.getMonth() + 1 }; });
  const { statement, loading, error } = useFinancialStatements(supabaseFinancialStatementsRepository, f);
  const upd = (p: Partial<StatementFilters>) => setF((s) => ({ ...s, ...p }));
  const s = statement?.summary;
  const empty = statement && statement.revenue.length === 0 && statement.cogs.length === 0 && statement.opex.length === 0 && statement.nonop.length === 0;
  const sel = "rounded-lg border border-border bg-background p-2 text-sm", qb = "rounded-lg bg-secondary px-3 py-2 text-xs font-bold";
  const period = f.monthFrom === f.monthTo ? `${String(f.monthFrom).padStart(2, "0")}/${f.year}` : `${String(f.monthFrom).padStart(2, "0")}–${String(f.monthTo).padStart(2, "0")}/${f.year}`;
  const kpi = (label: string, val: string, sub: string, cls: string) => (
    <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs font-bold text-muted-foreground">{label}</div><p className={`mt-1 font-display text-xl font-bold ${cls}`}>{val}</p><p className="text-xs text-muted-foreground">{sub}</p></div>
  );
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div><h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("incomeStatement")}</h1><p className="text-sm text-muted-foreground">{period}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={f.year} onChange={(e) => upd({ year: +e.target.value })} className={sel}>{[f.year + 1, f.year, f.year - 1, f.year - 2].filter((y, i, a) => a.indexOf(y) === i).map((y) => <option key={y} value={y}>{y}</option>)}</select>
        <select value={f.monthFrom} onChange={(e) => upd({ monthFrom: +e.target.value })} className={sel}>{M.map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}</select>
        <span className="text-muted-foreground">–</span>
        <select value={f.monthTo} onChange={(e) => upd({ monthTo: +e.target.value })} className={sel}>{M.map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}</select>
        <button type="button" onClick={() => upd({ monthFrom: 1, monthTo: 12 })} className={qb}>{t("fullYear")}</button>
        <button type="button" onClick={() => upd({ monthFrom: 1, monthTo: new Date().getMonth() + 1 })} className={qb}>{t("yearToDate")}</button>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">…</p>
        : error ? <p className="rounded-lg border border-destructive p-6 text-center text-sm text-destructive">{stmtErr(error, t)}</p>
        : !s || empty ? <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">{t("noDataForPeriod")}</p>
        : <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpi(t("totalRevenue"), formatCurrency(s.totalRevenue), "", "text-green-600")}
            {kpi(t("grossProfit"), formatCurrency(s.grossProfit), `${s.grossMarginPct}%`, "text-blue-600")}
            {kpi(t("operatingIncome"), formatCurrency(s.operatingIncome), `${s.operatingMarginPct}%`, "text-teal-600")}
            {kpi(t("netIncome"), formatCurrency(s.netIncome), `${s.netMarginPct}%`, s.netIncome < 0 ? "text-destructive" : "text-green-600")}
          </div>
          <IncomeStatementReport st={statement} />
        </>}
    </div>
  );
}
