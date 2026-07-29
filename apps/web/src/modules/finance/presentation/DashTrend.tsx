import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useI18n } from "@shared/i18n";
import { EmptyChartState } from "@finance/presentation/EmptyChartState";
import type { TrendPoint } from "@finance/domain/dashboard.types";

// Gráfica de tendencia del año: ingresos vs gastos + utilidad. Datos de get_trend_series (monthly_series_for).
const M = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function DashTrend({ trend }: { trend: readonly TrendPoint[] }) {
  const { t } = useI18n();
  const data = trend.filter((p) => p.income > 0 || p.expenses > 0).map((p) => ({ name: M[p.month] ?? `${p.month}`, income: p.income, expenses: p.expenses, profit: p.profit }));
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">{t("trend")}</p>
      {data.length < 2 ? <EmptyChartState message={t("chartNeedHistory")} /> : (
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={44} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="income" name={t("income")} stroke="seagreen" fill="seagreen" fillOpacity={0.2} />
          <Area type="monotone" dataKey="expenses" name={t("expenses")} stroke="crimson" fill="crimson" fillOpacity={0.15} />
          <Area type="monotone" dataKey="profit" name={t("netProfit")} stroke="royalblue" fill="royalblue" fillOpacity={0.1} />
        </AreaChart>
      </ResponsiveContainer>)}
    </div>
  );
}
