import { X, Globe } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { InventoryMovements } from "@fieldops/presentation/InventoryMovements";
import { InventoryItemCharts } from "@fieldops/presentation/InventoryItemCharts";
import { SignedPhotos } from "@fieldops/presentation/SignedPhotos";
import { BarcodeDisplay } from "@fieldops/presentation/BarcodeDisplay";
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
        {item.photoUrls.length > 0 && <SignedPhotos paths={item.photoUrls} size="lg" />}
        <dl className="space-y-1 font-body text-sm">
          <div className="text-xs font-bold uppercase text-muted-foreground">{t("itemData")}</div>
          {item.sku && row(t("sku"), item.sku)}
          {row(t("stock"), String(item.stock))}
          {row(t("minStock"), String(item.minStock))}
          {item.unitOfMeasureName && row(t("unitOfMeasure"), `${item.unitOfMeasureName} (${item.unitOfMeasureAbbreviation})`)}
          {cost && row(t("unitCost"), formatCurrency(item.unitCost))}
          {cost && row(t("stockValue"), formatCurrency(itemValue(item)))}
          {item.supplierName && row(t("supplier"), item.supplierName)}
          {item.lastRestockDate && row(t("lastRestock"), item.lastRestockDate.slice(0, 10))}
        </dl>
        {item.warehouseStock.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase text-muted-foreground">{t("stockByWarehouse")}</div>
            <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm">
              <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr><th className="px-2 py-1 text-left font-bold">{t("warehouse")}</th><th className="px-2 py-1 text-left font-bold">{t("location")}</th><th className="px-2 py-1 text-right font-bold">{t("stock")}</th><th className="px-2 py-1 text-right font-bold">{t("minStock")}</th></tr></thead>
              <tbody>{item.warehouseStock.map((e) => {
                const loc = [e.locationZone, e.locationAisle, e.locationShelf, e.locationBin].filter(Boolean).join("-") || "—";
                const cls = e.quantity <= 0 ? "text-destructive" : e.minStock && e.quantity <= e.minStock ? "text-amber-600" : "text-green-600";
                return <tr key={e.warehouseId} className="border-t border-border"><td className="px-2 py-1">{e.warehouseName} <span className="text-xs text-muted-foreground">({e.warehouseCode})</span></td><td className="px-2 py-1 text-muted-foreground">{loc}</td><td className={`px-2 py-1 text-right font-semibold ${cls}`}>{e.quantity}</td><td className="px-2 py-1 text-right text-muted-foreground">{e.minStock ?? "—"}</td></tr>;
              })}</tbody>
            </table></div>
          </div>
        )}
        {item.barcode ? <div className="border-t border-border pt-3"><BarcodeDisplay value={item.barcode} /></div> : <p className="text-xs text-muted-foreground">{t("noBarcode")}</p>}
        {cons.avg > 0 && <p className={`text-sm ${cons.high ? "font-bold text-destructive" : "text-muted-foreground"}`}>{t("consumeThisMonth")}: {cons.cur} ({t("average")}: {cons.avg.toFixed(1)}){cons.high && ` · ${t("highConsumption")}`}</p>}
        <InventoryItemCharts item={item} movs={movs} now={now} />
        <InventoryMovements itemId={item.id} />
      </div>
    </ScreenModal>
  );
}
