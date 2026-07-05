import { Megaphone } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { MktSnapshot } from "@finance/domain/dashboard.types";

export function DashboardMarketing({ m }: { m: MktSnapshot }) {
  const { t } = useI18n();
  const pct = m.executedPct < 80 ? "text-green-600" : m.executedPct <= 100 ? "text-yellow-600" : "text-red-600";
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Megaphone className="h-4 w-4 text-primary" /> {t("marketingExecuted")}</div>
      <div className={`text-2xl font-black md:text-3xl ${pct}`}>{m.executedPct}%</div>
      <div className="text-xs text-muted-foreground">{formatCurrency(m.totalSpent)} / {formatCurrency(m.totalBudget)}</div>
    </div>
  );
}
