import type { ReactNode } from "react";
import { Truck, DollarSign, Wrench, ShieldAlert } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { assetValue, expiringSoon } from "@assets/application/asset-helpers";
import type { Asset } from "@assets/domain/asset.types";

// KPIs: total · valor total · en mantenimiento · garantías/pólizas por vencer.
export function AssetKpis({ items, now }: { items: readonly Asset[]; now: Date }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const value = items.reduce((s, a) => s + assetValue(a), 0);
  const maint = items.filter((a) => a.status === "maintenance").length;
  const expiring = items.filter((a) => expiringSoon(a, now)).length;
  const card = (icon: ReactNode, label: string, val: string, cls = "") => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">{icon}{label}</div>
      <p className={`mt-1 font-display text-xl font-bold ${cls}`}>{val}</p>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {card(<Truck className="h-4 w-4" />, t("totalAssets"), String(items.length))}
      {can("assets", "cost") && card(<DollarSign className="h-4 w-4" />, t("assetsValue"), formatCurrency(value))}
      {card(<Wrench className="h-4 w-4" />, t("inMaintenance"), String(maint), maint > 0 ? "text-amber-600" : "")}
      {card(<ShieldAlert className="h-4 w-4" />, t("expiringSoon"), String(expiring), expiring > 0 ? "text-destructive" : "")}
    </div>
  );
}
