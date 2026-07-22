import { supabase } from "@shared/lib/supabase";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

// Snapshot de inventario de un producto del catálogo (migr 232). Mapea a un InventoryItem completo para poder
// reutilizar los modales de restock/ajuste. Costos vienen NULL sin inventory:cost (gate en la RPC).
export interface ProductSnapshot { linked: boolean; item: InventoryItem | null; isLow: boolean; stockValue: number | null; }
type J = Record<string, unknown>;
const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => (v as string | null) ?? "";

export async function getProductInventorySnapshot(productId: string): Promise<ProductSnapshot> {
  const { data, error } = await supabase.rpc("get_product_inventory_snapshot", { _product_id: productId });
  const d = (data as J | null) ?? {};
  if (error || d.linked !== true) return { linked: false, item: null, isLow: false, stockValue: null };
  const item: InventoryItem = {
    id: d.id as string, tenantId: "", name: s(d.name), stock: n(d.stock), unitCost: n(d.unit_cost), minStock: n(d.min_stock),
    sku: s(d.sku), avgCost: n(d.avg_cost), supplierName: s(d.supplier_name), supplierId: (d.supplier_id as string | null) ?? null,
    landingProductId: (d.landing_product_id as string | null) ?? null, lastRestockDate: (d.last_restock_date as string | null) ?? null,
    warehouseZone: s(d.warehouse_zone), aisle: s(d.aisle), shelf: s(d.shelf), bin: s(d.bin),
    reorderPoint: d.reorder_point == null ? null : n(d.reorder_point), reorderQty: d.reorder_qty == null ? null : n(d.reorder_qty), photoUrls: [],
  };
  return { linked: true, item, isLow: d.is_low === true, stockValue: d.stock_value == null ? null : n(d.stock_value) };
}
