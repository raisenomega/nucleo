import type { InventoryItem, InventoryFormData, InventoryMovement } from "@fieldops/domain/inventory.types";

type Num = number | string | null;
interface StockRow { warehouse_id: string; quantity: number | string; min_stock: Num; reorder_point: Num; reorder_qty: Num; location_zone: string | null; location_aisle: string | null; location_shelf: string | null; location_bin: string | null; warehouse: { id: string; name: string; code: string } | null; }
export interface Row {
  id: string; tenant_id: string; name: string; stock: number | string; reserved: number | string | null; unit_cost: number | string; min_stock: number | string;
  sku: string | null; avg_cost: number | string; supplier_name: string | null; supplier_id: string | null; landing_product_id: string | null; last_restock_date: string | null;
  warehouse_zone: string | null; aisle: string | null; shelf: string | null; bin: string | null; reorder_point: number | null; reorder_qty: number | null; photo_urls: string[] | null;
  category_id: string | null; category: { id: string; label: string } | null; unit_of_measure_id: string | null; unit_of_measure: { id: string; name: string; abbreviation: string } | null; barcode: string | null; tracking_type: "none" | "lot" | "serial"; stock_entries: StockRow[] | null;
}
interface MovRow { id: string; movement_type: string; quantity: number | string; movement_date: string; delta: number | string | null; unit_cost: number | string | null; cogs_total: number | string | null; cogs_unit: number | string | null; running_balance: number | string | null; notes: string | null; employee: string; client_name: string | null; service_type: string | null; route_date: string | null; }
const n = (v: Num) => (v == null ? null : Number(v));

export const SELECT = "id, tenant_id, name, stock, reserved, unit_cost, min_stock, sku, avg_cost, supplier_name, supplier_id, landing_product_id, last_restock_date, warehouse_zone, aisle, shelf, bin, reorder_point, reorder_qty, photo_urls, category_id, category:categories!category_id(id, label), unit_of_measure_id, unit_of_measure:units_of_measure!unit_of_measure_id(id, name, abbreviation), barcode, tracking_type, stock_entries:inventory_stock(warehouse_id, quantity, min_stock, reorder_point, reorder_qty, location_zone, location_aisle, location_shelf, location_bin, warehouse:warehouses(id, name, code))";

export function toItem(r: Row): InventoryItem {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name, stock: Number(r.stock), reserved: Number(r.reserved ?? 0), unitCost: Number(r.unit_cost), minStock: Number(r.min_stock), sku: r.sku ?? "",
    avgCost: Number(r.avg_cost), supplierName: r.supplier_name ?? "", supplierId: r.supplier_id, landingProductId: r.landing_product_id, lastRestockDate: r.last_restock_date,
    warehouseZone: r.warehouse_zone ?? "", aisle: r.aisle ?? "", shelf: r.shelf ?? "", bin: r.bin ?? "", reorderPoint: r.reorder_point, reorderQty: r.reorder_qty,
    photoUrls: r.photo_urls ?? [], categoryId: r.category_id, categoryName: r.category?.label ?? null, unitOfMeasureId: r.unit_of_measure_id, unitOfMeasureAbbreviation: r.unit_of_measure?.abbreviation ?? null, unitOfMeasureName: r.unit_of_measure?.name ?? null, barcode: r.barcode ?? null, trackingType: r.tracking_type ?? "none",
    warehouseStock: (r.stock_entries ?? []).map((e) => ({ warehouseId: e.warehouse_id, warehouseName: e.warehouse?.name ?? "", warehouseCode: e.warehouse?.code ?? "", quantity: Number(e.quantity), minStock: n(e.min_stock), reorderPoint: n(e.reorder_point), reorderQty: n(e.reorder_qty), locationZone: e.location_zone, locationAisle: e.location_aisle, locationShelf: e.location_shelf, locationBin: e.location_bin })),
  };
}

export function toRow(d: InventoryFormData) {
  return { name: d.name, sku: d.sku || null, stock: d.stock, unit_cost: d.unitCost, min_stock: d.minStock, landing_product_id: d.landingProductId, supplier_id: d.supplierId, warehouse_zone: d.warehouseZone || null, aisle: d.aisle || null, shelf: d.shelf || null, bin: d.bin || null, reorder_point: d.reorderPoint, reorder_qty: d.reorderQty, category_id: d.categoryId, unit_of_measure_id: d.unitOfMeasureId, barcode: d.barcode || null, tracking_type: d.trackingType };
}

export function toMovement(r: MovRow): InventoryMovement {
  return { id: r.id, type: r.movement_type, quantity: Number(r.quantity), date: r.movement_date, delta: Number(r.delta ?? 0), unitCost: n(r.unit_cost), cogsTotal: n(r.cogs_total), cogsUnit: n(r.cogs_unit), runningBalance: Number(r.running_balance ?? 0), notes: r.notes, employee: r.employee, clientName: r.client_name, serviceType: r.service_type, routeDate: r.route_date };
}
export type { MovRow };
