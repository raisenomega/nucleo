import { X, Globe } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { InventoryMovements } from "@fieldops/presentation/InventoryMovements";
import { InventoryChart } from "@fieldops/presentation/InventoryChart";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

export function InventoryDetail({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const cost = can("inventory", "cost");
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
          {cost && row(t("stockValue"), formatCurrency(item.stock * item.avgCost))}
          {item.supplierName && row(t("supplier"), item.supplierName)}
          {item.lastRestockDate && row(t("lastRestock"), item.lastRestockDate.slice(0, 10))}
        </dl>
        <InventoryChart itemId={item.id} />
        <InventoryMovements itemId={item.id} />
      </div>
    </ScreenModal>
  );
}
