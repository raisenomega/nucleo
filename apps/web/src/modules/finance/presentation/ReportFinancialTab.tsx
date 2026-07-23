import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ReportChart } from "@finance/presentation/ReportChart";
import { ReportBars } from "@finance/presentation/ReportBars";
import { ReportPieChart } from "@finance/presentation/ReportPieChart";
import { ReportLineChart } from "@finance/presentation/ReportLineChart";
import type { ReportSeries } from "@finance/domain/report.types";

const CK: Record<string, TranslationKey> = {
  fixed: "fixedExpense", variable: "variableExpense", debt: "debtExpense", one_time: "oneTimeExpense",
};
const grossPct = (income: number, cogs: number) => (income > 0 ? Math.round((100 * (income - cogs)) / income) : 0);

export function ReportFinancialTab({ s }: { s: ReportSeries }) {
  const { t } = useI18n();
  const byClass = new Map<string, number>();
  s.expenses_by_category.forEach((e) => {
    const k = e.class ?? "unclassified";
    byClass.set(k, (byClass.get(k) ?? 0) + e.total);
  });
  const pie = [...byClass].map(([k, v]) => ({ name: t(CK[k] ?? "unclassified"), value: v }));
  const trend = s.months.map((m) => ({ month: m.month, breakeven: m.expense + m.payroll }));
  const marginData = s.months.map((m) => ({ month: m.month, margin_pct: m.margin_pct, gross_pct: grossPct(m.income, m.cogs) }));
  const avg = s.months.length ? Math.round(s.months.reduce((a, m) => a + m.margin_pct, 0) / s.months.length) : 0;
  const totIncome = s.months.reduce((a, m) => a + m.income, 0), totCogs = s.months.reduce((a, m) => a + m.cogs, 0);
  const metric = (label: string, value: string, cls = "text-foreground") => (
    <div><p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-bold ${cls}`}>{value}</p></div>
  );
  const legend = `Margen bruto ${grossPct(totIncome, totCogs)}% (ventas − costo de lo vendido) vs. operativo ${avg}% (tras todos los gastos). La brecha ≈ tu overhead (nómina, fijos, marketing).`;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-card p-4">
        {metric("Margen bruto", formatCurrency(totIncome - totCogs), "text-green-600")}
        {metric("Margen bruto %", `${grossPct(totIncome, totCogs)}%`)}
        {metric("Costo de ventas (COGS)", formatCurrency(totCogs), "text-red-600")}
      </div>
      <ReportChart title={t("rIncomeVsExpense")}>
        <ReportBars data={s.months} xKey="month" bars={[{ key: "income", name: t("income"), color: "hsl(142 71% 45%)" }, { key: "expense", name: t("expenses"), color: "hsl(0 72% 51%)" }]} />
      </ReportChart>
      <ReportChart title={t("rExpenseByClass")}><ReportPieChart data={pie} /></ReportChart>
      <ReportChart title={t("rMargin")} legend={legend}>
        <ReportLineChart data={marginData} xKey="month" lines={[{ key: "gross_pct", name: "Margen bruto", color: "hsl(142 71% 45%)" }, { key: "margin_pct", name: t("rMargin"), color: "hsl(38 85% 55%)" }]} />
      </ReportChart>
      <ReportChart title={t("rBreakeven")}>
        <ReportLineChart data={trend} xKey="month" lines={[{ key: "breakeven", name: t("rBreakeven"), color: "hsl(0 72% 51%)" }]} />
      </ReportChart>
    </div>
  );
}
