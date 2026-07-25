import { supabase } from "@shared/lib/supabase";
import { SELECT, toItem, toRow, toMovement, type Row, type MovRow } from "@fieldops/infrastructure/inventory.mapper";
import type { InventoryItem, InventoryListResult, IInventoryRepository, Result, InventoryMovement, LandingProductRef } from "@fieldops/domain/inventory.types";

async function rpcId(fn: string, args: object): Promise<Result<string | null, string>> {
  const { data, error } = await supabase.rpc(fn, args);
  return error ? { ok: false, error: error.message } : { ok: true, value: data as string | null };
}

export const supabaseInventoryRepository: IInventoryRepository = {
  async list(): Promise<InventoryListResult> {
    const { data, error } = await supabase.from("inventory_items").select(SELECT).order("name");
    return error ? { ok: false, error: error.message } : { ok: true, value: (data as unknown as Row[]).map(toItem) };
  },
  async create(d): Promise<Result<InventoryItem, string>> {
    const { data, error } = await supabase.from("inventory_items").insert(toRow(d)).select(SELECT).single();
    return error || !data ? { ok: false, error: error?.message ?? "error" } : { ok: true, value: toItem(data as unknown as Row) };
  },
  async update(id, d): Promise<Result<InventoryItem, string>> {
    const { data, error } = await supabase.from("inventory_items").update(toRow(d)).eq("id", id).select(SELECT).single();
    return error || !data ? { ok: false, error: error?.message ?? "error" } : { ok: true, value: toItem(data as unknown as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
  async findByBarcode(barcode): Promise<InventoryItem | null> {
    const { data: id } = await supabase.rpc("find_item_by_barcode", { p_barcode: barcode });
    const { data } = id ? await supabase.from("inventory_items").select(SELECT).eq("id", id as string).single() : { data: null };
    return data ? toItem(data as unknown as Row) : null;
  },
  restock(itemId, d) { return rpcId("record_restock", { p_item_id: itemId, p_quantity: d.quantity, p_unit_cost: d.unitCost, p_supplier: d.supplier || null, p_notes: d.notes || null, p_date: d.date || undefined, p_supplier_id: d.supplierId || null, p_warehouse_id: d.warehouseId || null, p_lot_number: d.lotNumber || null, p_expiry_date: d.expiryDate || null, p_manufacture_date: d.manufactureDate || null }); },
  adjust(itemId, newQty, reason, warehouseId, lotId) { return rpcId("record_adjustment", { p_item_id: itemId, p_new_qty: newQty, p_reason: reason || null, p_warehouse_id: warehouseId || null, p_lot_id: lotId || null }); },
  shrink(itemId, qty, reason, warehouseId, lotId) { return rpcId("record_shrinkage", { p_item_id: itemId, p_qty: qty, p_reason: reason || null, p_warehouse_id: warehouseId || null, p_lot_id: lotId || null }); },
  transfer(itemId, d) { return rpcId("transfer_stock", { p_item_id: itemId, p_qty: d.qty, p_from_warehouse_id: d.fromWarehouseId, p_to_warehouse_id: d.toWarehouseId, p_notes: d.notes || null, p_lot_transfers: d.lotTransfers?.length ? d.lotTransfers.map((x) => ({ lot_id: x.lotId, qty: x.qty })) : null }); },
  async listMovements(itemId): Promise<InventoryMovement[]> {
    const { data } = await supabase.rpc("list_item_movements", { p_item_id: itemId });
    return ((data as MovRow[] | null) ?? []).map(toMovement);
  },
  async listLandingProducts(): Promise<LandingProductRef[]> {
    const { data } = await supabase.from("tenant_landing_products").select("id, name").order("name");
    return (data as LandingProductRef[] | null) ?? [];
  },
};
