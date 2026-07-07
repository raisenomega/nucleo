import { supabase } from "@shared/lib/supabase";
import type {
  InventoryItem, InventoryFormData, InventoryListResult, IInventoryRepository, Result, InventoryMovement,
} from "@fieldops/domain/inventory.types";

interface MovRow {
  id: string; movement_type: string; quantity: number | string; movement_date: string;
  notes: string | null; employee: string; client_name: string | null; service_type: string | null; route_date: string | null;
}

interface Row {
  id: string; tenant_id: string; name: string;
  stock: number | string; unit_cost: number | string; min_stock: number | string;
}

const SELECT = "id, tenant_id, name, stock, unit_cost, min_stock";

function toItem(r: Row): InventoryItem {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name,
    stock: Number(r.stock), unitCost: Number(r.unit_cost), minStock: Number(r.min_stock),
  };
}

function toRow(d: InventoryFormData) {
  return { name: d.name, stock: d.stock, unit_cost: d.unitCost, min_stock: d.minStock };
}

export const supabaseInventoryRepository: IInventoryRepository = {
  async list(): Promise<InventoryListResult> {
    const { data, error } = await supabase.from("inventory_items").select(SELECT).order("name");
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as unknown as Row[]).map(toItem) };
  },
  async create(d): Promise<Result<InventoryItem, string>> {
    const { data, error } = await supabase.from("inventory_items").insert(toRow(d)).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toItem(data as unknown as Row) };
  },
  async update(id, d): Promise<Result<InventoryItem, string>> {
    const { data, error } = await supabase.from("inventory_items").update(toRow(d)).eq("id", id).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toItem(data as unknown as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
  async listMovements(itemId): Promise<InventoryMovement[]> {
    const { data } = await supabase.rpc("list_item_movements", { p_item_id: itemId });
    return ((data as MovRow[] | null) ?? []).map((r) => ({
      id: r.id, type: r.movement_type, quantity: Number(r.quantity), date: r.movement_date,
      notes: r.notes, employee: r.employee, clientName: r.client_name, serviceType: r.service_type, routeDate: r.route_date,
    }));
  },
};
