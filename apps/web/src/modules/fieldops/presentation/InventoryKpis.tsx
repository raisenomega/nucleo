import { useEffect, type ReactNode } from "react";
import { Package, AlertTriangle, DollarSign, CalendarClock, Tag, CalendarX, Layers } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useCostingMethod } from "@shared/hooks/useCostingMethod";
import { formatCurrency } from "@shared/lib/format";
import { itemValue } from "@fieldops/application/inventory-analytics";
import { useInventoryLots } from "@fieldops/application/useInventoryLots.hook";
import { supabaseInventoryLotRepository } from "@fieldops/infrastructure/supabase-inventory-lot.repository";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

// FIX1 — KPIs. Gap#7: al montar expira lotes vencidos + KPI "próximos a vencer" si hay ítems con trazabilidad.
export function InventoryKpis({ items }: { items: readonly InventoryItem[] }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { method } = useCostingMethod();
  const lots = useInventoryLots(supabaseInventoryLotRepository);
  useEffect(() => { void lots.expireAll(); }, []);
  const hasTracking = items.some((i) => i.trackingType !== "none");
  const low = items.filter((i) => i.minStock > 0 && i.stock <= i.minStock).length;
  const value = items.reduce((s, i) => s + itemValue(i), 0);
  const last = items.map((i) => i.lastRestockDate).filter(Boolean).sort().at(-1);
  const byCat = new Map<string, number>();
  items.forEach((i) => { const k = i.categoryName ?? t("unlinked"); byCat.set(k, (byCat.get(k) ?? 0) + 1); });
  const card = (icon: ReactNode, label: string, val: string, cls = "") => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">{icon}{label}</div>
      <p className={`mt-1 font-display text-xl font-bold ${cls}`}>{val}</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {can("inventory", "cost") && method && (
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-muted-foreground"><Layers className="h-3.5 w-3.5" />{t("costingMethod")}: {method === "fifo" ? t("fifo") : t("weightedAverage")}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {card(<Package className="h-4 w-4" />, t("totalItems"), String(items.length))}
        {card(<AlertTriangle className="h-4 w-4" />, t("lowStock"), String(low), low > 0 ? "text-destructive" : "")}
        {can("inventory", "cost") && card(<DollarSign className="h-4 w-4" />, t("stockValue"), formatCurrency(value))}
        {card(<CalendarClock className="h-4 w-4" />, t("lastRestock"), last ? last.slice(0, 10) : "—")}
        {hasTracking && card(<CalendarX className="h-4 w-4" />, t("expiringLots"), String(lots.expiringLots.length), lots.expiringLots.length > 0 ? "text-amber-600" : "")}
      </div>
      {byCat.size > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground"><Tag className="h-3.5 w-3.5" />{t("byCategory")}</span>
          {[...byCat].map(([name, n]) => <span key={name} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{name}: {n}</span>)}
        </div>
      )}
    </div>
  );
}
