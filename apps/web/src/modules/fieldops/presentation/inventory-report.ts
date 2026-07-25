import type { TranslationKey } from "@shared/i18n";
import type { InventoryItem } from "@fieldops/domain/inventory.types";
import type { Supplier } from "@fieldops/domain/supplier.types";
import { itemValue, slowIds, type RawMov } from "@fieldops/application/inventory-analytics";
import { supabaseInventoryLotRepository } from "@fieldops/infrastructure/supabase-inventory-lot.repository";
import { getCostingMethod } from "@shared/lib/costing";

type T = (k: TranslationKey) => string;
const money = (n: number) => `$${n.toFixed(2)}`;
const loc = (i: InventoryItem) => [i.aisle, i.shelf, i.bin].filter(Boolean).join("-") || "—";
const isLow = (i: InventoryItem) => i.minStock > 0 && i.stock > 0 && i.stock <= i.minStock;
const ACT: [TranslationKey, string][] = [["stockIn", "entrada"], ["stockOut", "salida"], ["movVentaPublica", "venta_publica"], ["movMerma", "merma"], ["movAjuste", "ajuste"]];

// Reporte E2E de inventario (5 secciones) → body de /pdf/report (kpis + tablas). Sin charts (van en el dashboard).
export async function inventoryReportBody(items: readonly InventoryItem[], movs: RawMov[], suppliers: readonly Supplier[], now: Date, t: T) {
  const hasTracking = items.some((i) => i.trackingType !== "none");
  const exp = hasTracking ? await supabaseInventoryLotRepository.listExpiring(30) : [];
  const iName = (id: string) => items.find((x) => x.id === id)?.name ?? "?";
  const expTable = exp.length ? [{ title: t("expiringLots"), headers: [t("itemName"), t("lotNumber"), t("warehouse"), t("quantity"), t("expiryDate"), t("daysUntilExpiry")],
    rows: exp.map((l) => [iName(l.itemId), l.lotNumber, l.warehouseName, l.quantity, l.expiryDate?.slice(0, 10) ?? "—", l.expiryDate ? Math.round((new Date(l.expiryDate).getTime() - now.getTime()) / 86400000) : "—"]) }] : [];
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
  // Valuación FIFO (solo si el tenant usa fifo): capas available agrupadas por ítem (received ASC = viejo→nuevo).
  const method = await getCostingMethod();
  const fifoLayers = method === "fifo" ? await supabaseInventoryLotRepository.listActiveCostLayers() : [];
  const fg = new Map<string, { qty: number; val: number; costs: number[] }>();
  fifoLayers.forEach((l) => { const g = fg.get(l.itemId) ?? { qty: 0, val: 0, costs: [] }; g.qty += l.quantity; g.val += l.quantity * (l.unitCost ?? 0); g.costs.push(l.unitCost ?? 0); fg.set(l.itemId, g); });
  const fifoValue = [...fg.values()].reduce((s, g) => s + g.val, 0);
  const fifoKpis = method === "fifo" ? [{ label: t("valueByFifo"), value: money(fifoValue) }, { label: t("valueByAverage"), value: money(value) }] : [];
  const fifoTable = method === "fifo" ? [{ title: t("fifoValuation"), headers: [t("itemName"), t("activeLayers"), t("quantity"), t("oldestCost"), t("newestCost"), t("value")],
    rows: [...fg.entries()].map(([id, g]) => [iName(id), g.costs.length, g.qty, money(g.costs[0] ?? 0), money(g.costs.at(-1) ?? 0), money(g.val)]) }] : [];
  return {
    title: t("inventoryReport"), date_from: "", date_to: "", charts: [] as never[],
    kpis: [
      { label: t("totalItems"), value: String(items.length) }, { label: t("stockValue"), value: money(value) },
      { label: t("lowStock"), value: String(low.length) }, { label: t("filterNoStock"), value: String(noStock.length) },
      { label: t("slowStock"), value: String(slowList.length) }, { label: t("lastRestock"), value: lastR ? lastR.slice(0, 10) : "—" },
      ...fifoKpis,
    ],
    tables: [
      { title: t("filterNoStock"), headers: [t("itemName"), t("sku"), t("minStock")], rows: noStock.map((i) => [i.name, i.sku || "—", i.minStock]) },
      { title: t("filterLow"), headers: [t("itemName"), t("stock"), t("minStock"), t("supplier")], rows: low.map((i) => [i.name, i.stock, i.minStock, supName(i.supplierId)]) },
      { title: t("slowStock"), headers: [t("itemName"), t("stock"), t("location")], rows: slowList.map((i) => [i.name, i.stock, loc(i)]) },
      { title: t("activityMonth"), headers: [t("movementType"), t("quantity"), t("value")], rows: ACT.map(([k, ty]) => { const r = mth.filter((m) => m.type === ty); return [t(k), r.reduce((s, m) => s + m.quantity, 0), money(r.reduce((s, m) => s + m.quantity * m.unitCost, 0))]; }) },
      { title: t("suppliers"), headers: [t("name"), t("leadTime"), t("filterLow")], rows: suppliers.filter((s) => s.active).map((s) => [s.name, s.leadTimeDays != null ? `${s.leadTimeDays}d` : "—", String(low.filter((i) => i.supplierId === s.id).length)]) },
      { title: t("inventoryList"), headers: [t("itemName"), t("sku"), t("category"), t("location"), t("stock"), t("minStock"), t("value"), t("supplier"), t("status")],
        rows: items.map((i) => [i.name, i.sku || "—", i.categoryName ?? "—", loc(i), `${i.stock}${i.unitOfMeasureAbbreviation ? " " + i.unitOfMeasureAbbreviation : ""}`, i.minStock, money(itemValue(i)), supName(i.supplierId), est(i)]) },
      ...expTable,
      ...fifoTable,
    ],
  };
}
