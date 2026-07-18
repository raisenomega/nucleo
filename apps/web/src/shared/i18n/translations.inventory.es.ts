import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (inventario Fase 1: reposición + puente landing). Se fusiona en translations.ts.
export const esInventory = {
  restock: "Reabastecer",
  registerEntry: "Registrar entrada",
  supplier: "Proveedor",
  inCatalog: "Catálogo",
  inCatalogTooltip: "Este item se vende en la tienda pública",
  catalogProduct: "Producto del catálogo",
  entryRegistered: "Entrada registrada",
  unlinked: "Sin vincular",
  movVentaPublica: "Venta pública",
  movAjuste: "Ajuste",
  movMerma: "Merma",
  movDevolucion: "Devolución",
  totalItems: "Total items", stockValue: "Valor total", lastRestock: "Último restock",
  filterAll: "Todos", filterLow: "Stock bajo", filterCatalog: "En catálogo", filterNoStock: "Sin stock",
  value: "Valor", itemData: "Datos del item", movIns: "Entradas", movOuts: "Salidas",
  adjustStock: "Ajustar stock", newQuantity: "Nueva cantidad", registerShrinkage: "Registrar merma", lostQuantity: "Cantidad perdida",
} satisfies Partial<Record<TranslationKey, string>>;
