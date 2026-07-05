import { DollarSign, Percent, Target, TrendingUp, UserPlus, Wallet } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { MarketingSnapshot } from "@crm/domain/marketing.types";

export function MarketingKpis({ s }: { s: MarketingSnapshot }) {
  const { t } = useI18n();
  const pct = s.executedPct < 80 ? "text-green-600" : s.executedPct <= 100 ? "text-yellow-600" : "text-red-600";
  const items = [
    { Icon: Wallet, l: "budgetedAmount" as const, v: formatCurrency(s.totalBudget), c: "" },
    { Icon: DollarSign, l: "spent" as const, v: formatCurrency(s.totalSpent), c: "" },
    { Icon: Percent, l: "executed" as const, v: `${s.executedPct}%`, c: pct },
    { Icon: UserPlus, l: "leadsGenerated" as const, v: String(s.leadsGenerated), c: "" },
    { Icon: Target, l: "cac" as const, v: formatCurrency(s.cac), c: "" },
    { Icon: TrendingUp, l: "roi" as const, v: `${s.roi}%`, c: s.roi >= 100 ? "text-green-600" : "" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map((k) => (
        <div key={k.l} className="space-y-1 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><k.Icon className="h-4 w-4" /> {t(k.l)}</div>
          <div className={`text-xl font-black ${k.c}`}>{k.v}</div>
        </div>
      ))}
    </div>
  );
}
