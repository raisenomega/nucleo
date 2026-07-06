import { Scale, TrendingDown, TrendingUp, Landmark } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { Snapshot } from "@finance/domain/dashboard.types";

export function DashboardKpis({ s, bankBalance }: { s: Snapshot; bankBalance?: number }) {
  const { t } = useI18n();
  const card = "space-y-2 rounded-lg border border-border bg-card p-5";
  const amount = "text-2xl font-black md:text-3xl";
  const lbl = "flex items-center gap-2 text-xs text-muted-foreground";
  return (
    <div className={`grid grid-cols-1 gap-4 ${bankBalance === undefined ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
      {bankBalance !== undefined && (
        <div className={card}>
          <div className={lbl}><Landmark className="h-4 w-4 text-primary" /> {t("bankBalance")}</div>
          <div className={`${amount} text-primary`}>{formatCurrency(bankBalance)}</div>
          <div className="text-xs text-muted-foreground">{t("calculatedBalance")}</div>
        </div>
      )}
      <div className={card}>
        <div className={lbl}><TrendingUp className="h-4 w-4 text-green-600" /> {t("income")}</div>
        <div className={`${amount} text-green-600`}>{formatCurrency(s.totalIncome)}</div>
        <div className="text-xs text-muted-foreground">{s.incomeCount} · {s.topIncomeCategory ?? "—"}</div>
      </div>
      <div className={card}>
        <div className={lbl}><TrendingDown className="h-4 w-4 text-destructive" /> {t("expenses")}</div>
        <div className={`${amount} text-destructive`}>{formatCurrency(s.totalExpenses)}</div>
        <div className="text-xs text-muted-foreground">{s.expenseCount} · {s.topExpenseCategory ?? "—"}</div>
      </div>
      <div className={card}>
        <div className={lbl}><Scale className="h-4 w-4 text-primary" /> {t("balance")}</div>
        <div className={`${amount} ${s.balance >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(s.balance)}</div>
        <div className="text-xs text-muted-foreground">{t("monthSummary")}</div>
      </div>
    </div>
  );
}
