import type { ReactNode } from "react";
import { Package, AlertTriangle, DollarSign, CalendarClock } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { itemValue } from "@fieldops/application/inventory-analytics";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

// FIX1 — KPIs: total items, stock bajo, valor total (stock×avg_cost, fallback unit_cost), último restock.
export function InventoryKpis({ items }: { items: readonly InventoryItem[] }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const low = items.filter((i) => i.minStock > 0 && i.stock <= i.minStock).length;
  const value = items.reduce((s, i) => s + itemValue(i), 0);
  const last = items.map((i) => i.lastRestockDate).filter(Boolean).sort().at(-1);
  const card = (icon: ReactNode, label: string, val: string, cls = "") => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">{icon}{label}</div>
      <p className={`mt-1 font-display text-xl font-bold ${cls}`}>{val}</p>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {card(<Package className="h-4 w-4" />, t("totalItems"), String(items.length))}
      {card(<AlertTriangle className="h-4 w-4" />, t("lowStock"), String(low), low > 0 ? "text-destructive" : "")}
      {can("inventory", "cost") && card(<DollarSign className="h-4 w-4" />, t("stockValue"), formatCurrency(value))}
      {card(<CalendarClock className="h-4 w-4" />, t("lastRestock"), last ? last.slice(0, 10) : "—")}
    </div>
  );
}
