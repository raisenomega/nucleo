import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { DashData } from "@finance/application/useDashboard.hook";
import type { RecentItem } from "@finance/domain/dashboard.types";
import { DashFinance } from "@finance/presentation/DashFinance";
import { DashTrend } from "@finance/presentation/DashTrend";
import { DashPie } from "@finance/presentation/DashPie";
import { DashList } from "@finance/presentation/DashList";

// Vista profunda Finanzas: KPIs + GL + tendencia + gastos por categoría (pie) + recientes.
export function DashboardFinanzas({ d, gl }: { d: DashData; gl: boolean }) {
  const { t } = useI18n();
  const exp = (d.fiscal?.expenseBreakdown ?? []).map((e) => ({ name: e.category, value: e.amount }));
  const rec = (items: readonly RecentItem[]) => items.map((r) => ({ label: r.category ?? "—", sub: r.date, value: formatCurrency(r.amount) }));
  return (
    <div className="space-y-4">
      <DashFinance d={d} glEnabled={gl} bank={d.fiscal?.bankCalculated} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><DashTrend trend={d.trend} /><DashPie title={t("expensesByCategory")} data={exp} /></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DashList title={t("income")} rows={rec(d.snapshot?.recentIncome ?? [])} />
        <DashList title={t("expenses")} rows={rec(d.snapshot?.recentExpenses ?? [])} />
      </div>
    </div>
  );
}
