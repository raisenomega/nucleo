import type { TranslationKey } from "@shared/i18n";
import type { InventoryItem } from "@fieldops/domain/inventory.types";
import type { Supplier } from "@fieldops/domain/supplier.types";
import { itemValue, slowIds, type RawMov } from "@fieldops/application/inventory-analytics";

type T = (k: TranslationKey) => string;
const money = (n: number) => `$${n.toFixed(2)}`;
const loc = (i: InventoryItem) => [i.aisle, i.shelf, i.bin].filter(Boolean).join("-") || "—";
const isLow = (i: InventoryItem) => i.minStock > 0 && i.stock > 0 && i.stock <= i.minStock;
const ACT: [TranslationKey, string][] = [["stockIn", "entrada"], ["stockOut", "salida"], ["movVentaPublica", "venta_publica"], ["movMerma", "merma"], ["movAjuste", "ajuste"]];

// Reporte E2E de inventario (5 secciones) → body de /pdf/report (kpis + tablas). Sin charts (van en el dashboard).
export function inventoryReportBody(items: readonly InventoryItem[], movs: RawMov[], suppliers: readonly Supplier[], now: Date, t: T) {
  const slow = slowIds(movs, items, now);
  const value = items.reduce((s, i) => s + itemValue(i), 0);
  const noStock = items.filter((i) => i.stock <= 0);
  const low = items.filter(isLow);
  const slowList = items.filter((i) => slow.has(i.id));
  const cm = now.toISOString().slice(0, 7);
  const mth = movs.filter((m) => m.date.slice(0, 7) === cm);
  const supName = (id: string | null) => suppliers.find((s) => s.id === id)?.name ?? "—";
  const est = (i: InventoryItem) => (i.stock <= 0 ? t("filterNoStock") : isLow(i) ? t("filterLow") : "OK");
  const lastR = items.map((i) => i.lastRestockDate).filter(Boolean).sort().at(-1);
  return {
    title: t("inventoryReport"), date_from: "", date_to: "", charts: [] as never[],
    kpis: [
      { label: t("totalItems"), value: String(items.length) }, { label: t("stockValue"), value: money(value) },
      { label: t("lowStock"), value: String(low.length) }, { label: t("filterNoStock"), value: String(noStock.length) },
      { label: t("slowStock"), value: String(slowList.length) }, { label: t("lastRestock"), value: lastR ? lastR.slice(0, 10) : "—" },
    ],
    tables: [
      { title: t("filterNoStock"), headers: [t("itemName"), t("sku"), t("minStock")], rows: noStock.map((i) => [i.name, i.sku || "—", i.minStock]) },
      { title: t("filterLow"), headers: [t("itemName"), t("stock"), t("minStock"), t("supplier")], rows: low.map((i) => [i.name, i.stock, i.minStock, supName(i.supplierId)]) },
      { title: t("slowStock"), headers: [t("itemName"), t("stock"), t("location")], rows: slowList.map((i) => [i.name, i.stock, loc(i)]) },
      { title: t("activityMonth"), headers: [t("movementType"), t("quantity"), t("value")], rows: ACT.map(([k, ty]) => { const r = mth.filter((m) => m.type === ty); return [t(k), r.reduce((s, m) => s + m.quantity, 0), money(r.reduce((s, m) => s + m.quantity * m.unitCost, 0))]; }) },
      { title: t("suppliers"), headers: [t("name"), t("leadTime"), t("filterLow")], rows: suppliers.filter((s) => s.active).map((s) => [s.name, s.leadTimeDays != null ? `${s.leadTimeDays}d` : "—", String(low.filter((i) => i.supplierId === s.id).length)]) },
      { title: t("inventoryList"), headers: [t("itemName"), t("sku"), t("location"), t("stock"), t("minStock"), t("value"), t("supplier"), t("status")],
        rows: items.map((i) => [i.name, i.sku || "—", loc(i), i.stock, i.minStock, money(itemValue(i)), supName(i.supplierId), est(i)]) },
    ],
  };
}
