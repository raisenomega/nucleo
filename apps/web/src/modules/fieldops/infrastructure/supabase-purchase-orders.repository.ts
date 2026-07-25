import { supabase } from "@shared/lib/supabase";
import type { PurchaseOrder, POCreateData, POStatus, ReorderSuggestion, IPurchaseOrderRepository } from "@fieldops/domain/purchase-order.types";
import type { Result } from "@fieldops/domain/inventory.types";

const SELECT = "id, order_number, supplier_id, status, expected_at, received_at, total_cost, notes, warehouse_id, warehouse:warehouses(name), supplier:inventory_suppliers(name), items:inventory_purchase_order_items(id, item_id, quantity, unit_cost, received_qty, item:inventory_items(name, tracking_type))";
const toPO = (r: Record<string, unknown>): PurchaseOrder => ({
  id: r.id as string, orderNumber: Number(r.order_number), supplierId: (r.supplier_id as string) ?? null,
  supplierName: ((r.supplier as { name?: string } | null)?.name) ?? "—", status: r.status as POStatus,
  expectedAt: (r.expected_at as string) ?? null, receivedAt: (r.received_at as string) ?? null,
  totalCost: Number(r.total_cost), notes: (r.notes as string) ?? "",
  warehouseId: (r.warehouse_id as string) ?? null, warehouseName: ((r.warehouse as { name?: string } | null)?.name) ?? null,
  items: ((r.items as Record<string, unknown>[] | null) ?? []).map((x) => ({
    id: x.id as string, itemId: x.item_id as string, itemName: ((x.item as { name?: string } | null)?.name) ?? "?",
    quantity: Number(x.quantity), unitCost: Number(x.unit_cost), receivedQty: Number(x.received_qty ?? 0),
    trackingType: ((x.item as { tracking_type?: "none" | "lot" | "serial" } | null)?.tracking_type) ?? "none",
  })),
});

export const supabasePurchaseOrderRepository: IPurchaseOrderRepository = {
  async list(): Promise<Result<PurchaseOrder[], string>> {
    const { data, error } = await supabase.from("inventory_purchase_orders").select(SELECT).order("order_number", { ascending: false });
    return error ? { ok: false, error: error.message } : { ok: true, value: (data as Record<string, unknown>[]).map(toPO) };
  },
  async create(d): Promise<Result<string, string>> {
    const total = d.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
    const { data, error } = await supabase.from("inventory_purchase_orders").insert({ supplier_id: d.supplierId, status: d.markOrdered ? "ordered" : "draft", ordered_at: d.markOrdered ? new Date().toISOString() : null, expected_at: d.expectedAt || null, notes: d.notes || null, total_cost: total, warehouse_id: d.warehouseId }).select("id").single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    const id = (data as { id: string }).id;
    const { error: e2 } = await supabase.from("inventory_purchase_order_items").insert(d.lines.map((l) => ({ order_id: id, item_id: l.itemId, quantity: l.quantity, unit_cost: l.unitCost })));
    return e2 ? { ok: false, error: e2.message } : { ok: true, value: id };
  },
  async setStatus(id, status): Promise<Result<null, string>> {
    const patch: Record<string, unknown> = { status };
    if (status === "ordered") patch.ordered_at = new Date().toISOString();
    const { error } = await supabase.from("inventory_purchase_orders").update(patch).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
  async receive(id, items): Promise<Result<null, string>> {
    const { error } = await supabase.rpc("receive_purchase_order", { p_order_id: id, p_items: items.map((x) => ({ item_id: x.itemId, received_qty: x.receivedQty, lot_number: x.lotNumber || null, expiry_date: x.expiryDate || null })) });
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
  async suggestions(): Promise<ReorderSuggestion[]> {
    const { data } = await supabase.rpc("generate_reorder_suggestions");
    return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({
      itemId: r.item_id as string, name: r.name as string, stock: Number(r.stock), reorderPoint: Number(r.reorder_point),
      reorderQty: Number(r.reorder_qty), supplierId: (r.supplier_id as string) ?? null, supplierName: (r.supplier_name as string) ?? "—", unitCost: Number(r.unit_cost),
    }));
  },
};
