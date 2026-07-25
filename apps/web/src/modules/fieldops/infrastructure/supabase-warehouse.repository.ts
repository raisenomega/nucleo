import { supabase } from "@shared/lib/supabase";
import type { Warehouse, WarehouseFormData, IWarehouseRepository } from "@fieldops/domain/warehouse.types";
import type { Result } from "@fieldops/domain/inventory.types";

interface Row { id: string; tenant_id: string; name: string; code: string; address: string | null; is_default: boolean; is_active: boolean; notes: string | null; created_at: string; }
const SELECT = "id, tenant_id, name, code, address, is_default, is_active, notes, created_at";
function toWh(r: Row): Warehouse { return { id: r.id, tenantId: r.tenant_id, name: r.name, code: r.code, address: r.address, isDefault: r.is_default, isActive: r.is_active, notes: r.notes, createdAt: r.created_at }; }
function toRow(d: WarehouseFormData) { return { name: d.name, code: d.code, address: d.address || null, notes: d.notes || null }; }

export const supabaseWarehouseRepository: IWarehouseRepository = {
  async list(): Promise<Result<Warehouse[], string>> {
    const { data, error } = await supabase.from("warehouses").select(SELECT).is("deleted_at", null).order("is_default", { ascending: false }).order("name");
    return error ? { ok: false, error: error.message } : { ok: true, value: (data as unknown as Row[]).map(toWh) };
  },
  async create(d): Promise<Result<Warehouse, string>> {
    const { data, error } = await supabase.from("warehouses").insert(toRow(d)).select(SELECT).single();
    return error || !data ? { ok: false, error: error?.message ?? "error" } : { ok: true, value: toWh(data as unknown as Row) };
  },
  async update(id, d): Promise<Result<Warehouse, string>> {
    const { data, error } = await supabase.from("warehouses").update(toRow(d)).eq("id", id).select(SELECT).single();
    return error || !data ? { ok: false, error: error?.message ?? "error" } : { ok: true, value: toWh(data as unknown as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { count } = await supabase.from("inventory_stock").select("id", { count: "exact", head: true }).eq("warehouse_id", id).gt("quantity", 0);
    if (count && count > 0) return { ok: false, error: "cannotDeleteWithStock" };
    const { error } = await supabase.from("warehouses").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
};
