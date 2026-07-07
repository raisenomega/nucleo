import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { ReportChart } from "@finance/presentation/ReportChart";
import { ReportBars } from "@finance/presentation/ReportBars";
import { ReportPieChart } from "@finance/presentation/ReportPieChart";
import { ReportLineChart } from "@finance/presentation/ReportLineChart";
import type { ReportSeries } from "@finance/domain/report.types";

const CK: Record<string, TranslationKey> = {
  fixed: "fixedExpense", variable: "variableExpense", debt: "debtExpense", one_time: "oneTimeExpense",
};

export function ReportFinancialTab({ s }: { s: ReportSeries }) {
  const { t } = useI18n();
  const byClass = new Map<string, number>();
  s.expenses_by_category.forEach((e) => {
    const k = e.class ?? "unclassified";
    byClass.set(k, (byClass.get(k) ?? 0) + e.total);
  });
  const pie = [...byClass].map(([k, v]) => ({ name: t(CK[k] ?? "unclassified"), value: v }));
  const trend = s.months.map((m) => ({ month: m.month, breakeven: m.expense + m.payroll }));
  const avg = s.months.length ? Math.round(s.months.reduce((a, m) => a + m.margin_pct, 0) / s.months.length) : 0;
  const legend = `Tu margen operativo promedio es ${avg}%. El break-even (gastos + nómina) marca cuánto necesitas vender.`;
  return (
    <div className="space-y-4">
      <ReportChart title={t("rIncomeVsExpense")}>
        <ReportBars data={s.months} xKey="month" bars={[{ key: "income", name: t("income"), color: "hsl(142 71% 45%)" }, { key: "expense", name: t("expenses"), color: "hsl(0 72% 51%)" }]} />
      </ReportChart>
      <ReportChart title={t("rExpenseByClass")}><ReportPieChart data={pie} /></ReportChart>
      <ReportChart title={t("rMargin")} legend={legend}>
        <ReportLineChart data={s.months} xKey="month" lines={[{ key: "margin_pct", name: t("rMargin"), color: "hsl(38 85% 55%)" }]} />
      </ReportChart>
      <ReportChart title={t("rBreakeven")}>
        <ReportLineChart data={trend} xKey="month" lines={[{ key: "breakeven", name: t("rBreakeven"), color: "hsl(0 72% 51%)" }]} />
      </ReportChart>
    </div>
  );
}
