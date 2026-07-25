import { supabase } from "@shared/lib/supabase";
import type { InventoryLot, LotStatus, IInventoryLotRepository } from "@fieldops/domain/inventory-lot.types";
import type { Result } from "@fieldops/domain/inventory.types";

const SELECT = "id, item_id, warehouse_id, lot_number, lot_type, quantity, expiry_date, manufacture_date, received_date, supplier_id, unit_cost, status, notes, created_at, warehouse:warehouses(name), supplier:inventory_suppliers(name)";
type Row = Record<string, unknown>;
const s = (v: unknown) => (v as string | null) ?? null;
function toLot(r: Row): InventoryLot {
  return {
    id: r.id as string, itemId: r.item_id as string, warehouseId: r.warehouse_id as string, warehouseName: ((r.warehouse as { name?: string } | null)?.name) ?? "",
    lotNumber: r.lot_number as string, lotType: r.lot_type as "lot" | "serial", quantity: Number(r.quantity),
    expiryDate: s(r.expiry_date), manufactureDate: s(r.manufacture_date), receivedDate: s(r.received_date),
    supplierId: s(r.supplier_id), supplierName: ((r.supplier as { name?: string } | null)?.name) ?? null,
    unitCost: r.unit_cost == null ? null : Number(r.unit_cost), status: r.status as LotStatus, notes: s(r.notes), createdAt: r.created_at as string,
  };
}

export const supabaseInventoryLotRepository: IInventoryLotRepository = {
  async listByItem(itemId): Promise<InventoryLot[]> {
    const { data } = await supabase.from("inventory_lots").select(SELECT).eq("item_id", itemId).order("expiry_date", { ascending: true, nullsFirst: false });
    return ((data as Row[] | null) ?? []).map(toLot);
  },
  async listExpiring(daysAhead): Promise<InventoryLot[]> {
    const cut = new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
    const { data } = await supabase.from("inventory_lots").select(SELECT).eq("status", "available").not("expiry_date", "is", null).lte("expiry_date", cut).order("expiry_date");
    return ((data as Row[] | null) ?? []).map(toLot);
  },
  async updateStatus(lotId, status): Promise<Result<null, string>> {
    const { error } = await supabase.from("inventory_lots").update({ status }).eq("id", lotId);
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
  async expireAll(): Promise<number> {
    const { data } = await supabase.rpc("_expire_inventory_lots");
    return (data as number | null) ?? 0;
  },
};
