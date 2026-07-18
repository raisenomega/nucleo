import type { TranslationKey } from "@shared/i18n";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

// Body de /pdf/report para el inventario (headers en español, patrón de finance-reports).
export function inventoryReportBody(items: readonly InventoryItem[], t: (k: TranslationKey) => string) {
  return {
    title: t("inventory"), date_from: "", date_to: "", charts: [] as never[],
    kpis: [{ label: t("totalItems"), value: String(items.length) },
      { label: t("lowStock"), value: String(items.filter((i) => i.minStock > 0 && i.stock <= i.minStock).length) }],
    tables: [{ title: t("inventoryList"), headers: [t("itemName"), t("stock"), t("minStock"), t("unitCost")],
      rows: items.map((i) => [i.name, i.stock, i.minStock, `$${i.unitCost.toFixed(2)}`]) }],
  };
}
