import { X, Globe } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { InventoryMovements } from "@fieldops/presentation/InventoryMovements";
import { InventoryItemCharts } from "@fieldops/presentation/InventoryItemCharts";
import { consumption, itemValue, type RawMov } from "@fieldops/application/inventory-analytics";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

export function InventoryDetail({ item, movs, now, onClose }: { item: InventoryItem; movs: RawMov[]; now: Date; onClose: () => void }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const cost = can("inventory", "cost");
  const cons = consumption(movs, item.id, now);
  const row = (label: string, v: string) => (
    <div><dt className="inline text-muted-foreground">{label}: </dt><dd className="inline">{v}</dd></div>
  );
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-foreground">{item.name}{item.landingProductId && <span title={t("inCatalogTooltip")} className="text-primary"><Globe className="h-4 w-4" /></span>}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4 md:p-6">
        <dl className="space-y-1 font-body text-sm">
          <div className="text-xs font-bold uppercase text-muted-foreground">{t("itemData")}</div>
          {item.sku && row(t("sku"), item.sku)}
          {row(t("stock"), String(item.stock))}
          {row(t("minStock"), String(item.minStock))}
          {cost && row(t("unitCost"), formatCurrency(item.unitCost))}
          {cost && row(t("stockValue"), formatCurrency(itemValue(item)))}
          {item.supplierName && row(t("supplier"), item.supplierName)}
          {item.lastRestockDate && row(t("lastRestock"), item.lastRestockDate.slice(0, 10))}
          {(item.warehouseZone || item.aisle || item.shelf || item.bin) && row(t("location"), [item.warehouseZone, item.aisle, item.shelf, item.bin].filter(Boolean).join(" · "))}
        </dl>
        {cons.avg > 0 && <p className={`text-sm ${cons.high ? "font-bold text-destructive" : "text-muted-foreground"}`}>{t("consumeThisMonth")}: {cons.cur} ({t("average")}: {cons.avg.toFixed(1)}){cons.high && ` · ${t("highConsumption")}`}</p>}
        <InventoryItemCharts item={item} movs={movs} now={now} />
        <InventoryMovements itemId={item.id} />
      </div>
    </ScreenModal>
  );
}
