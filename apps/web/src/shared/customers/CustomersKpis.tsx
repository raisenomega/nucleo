import type { ReactNode } from "react";
import { Users, TrendingUp, DollarSign, Star } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { CustomerKpis } from "@shared/customers/customers-agg";

export function CustomersKpis({ kpis }: { kpis: CustomerKpis }) {
  const { t } = useI18n();
  const card = (icon: ReactNode, label: string, value: string) => (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {card(<Users className="h-4 w-4" />, t("cTotalCustomers"), String(kpis.total))}
      {card(<TrendingUp className="h-4 w-4" />, t("cActive30"), String(kpis.active30))}
      {card(<DollarSign className="h-4 w-4" />, t("cTotalBilled"), formatCurrency(kpis.totalBilled))}
      {card(<Star className="h-4 w-4" />, t("cAvgRating"), kpis.avgRating ? kpis.avgRating.toFixed(1) : "—")}
    </div>
  );
}
