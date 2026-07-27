import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { KpiCard } from "@finance/presentation/KpiCard";
import type { DashData } from "@finance/application/useDashboard.hook";

// Banda Finanzas + GL. Fila 1 = cash (con variación vs mes anterior). Fila 2 = GL (solo si gl_enabled).
const pct = (cur: number, prev?: number) => (prev && prev !== 0 ? ((cur - prev) / Math.abs(prev)) * 100 : null);

export function DashFinance({ d, glEnabled, bank }: { d: DashData; glEnabled: boolean; bank?: number }) {
  const { t } = useI18n();
  const s = d.snapshot, p = d.prevSnapshot ?? undefined, f = d.fiscal;
  if (!s) return <p className="text-sm text-muted-foreground">{t("loadError")}</p>;
  const cogs = d.inv?.cogsMonth ?? 0;
  const gross = s.totalIncome - cogs;
  const net = f?.operatingProfit ?? s.balance;
  const margin = s.totalIncome > 0 ? (net / s.totalIncome) * 100 : 0;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={t("income")} value={formatCurrency(s.totalIncome)} delta={pct(s.totalIncome, p?.totalIncome)} sub={s.topIncomeCategory ?? undefined} />
        <KpiCard label={t("expenses")} value={formatCurrency(s.totalExpenses)} delta={pct(s.totalExpenses, p?.totalExpenses)} sub={s.topExpenseCategory ?? undefined} />
        <KpiCard label={t("balanceCol")} value={formatCurrency(s.balance)} delta={pct(s.balance, p?.balance)} />
        {bank != null && <KpiCard label={t("bankName")} value={formatCurrency(bank)} />}
      </div>
      {glEnabled && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label={t("grossProfit")} value={formatCurrency(gross)} />
          <KpiCard label={t("netProfit")} value={formatCurrency(net)} />
          <KpiCard label={t("netMargin")} value={`${margin.toFixed(0)}%`} />
          <KpiCard label={t("cogsMonth")} value={formatCurrency(cogs)} />
        </div>
      )}
    </div>
  );
}
