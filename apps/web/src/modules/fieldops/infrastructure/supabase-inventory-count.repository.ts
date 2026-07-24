import { supabase } from "@shared/lib/supabase";
import { toCount, type CountRow } from "@fieldops/infrastructure/inventory-count.mapper";
import type { CountFormData, InventoryCount, IInventoryCountRepository } from "@fieldops/domain/inventory-count.types";
import type { Result } from "@fieldops/domain/inventory.types";

const NAMES = "assigned:profiles!assigned_to(full_name), creator:profiles!created_by(full_name)";
const LIST = `*, ${NAMES}, lines:inventory_count_lines(line_status, variance)`;
const DETAIL = `*, ${NAMES}, lines:inventory_count_lines(*, item:inventory_items(name, sku), counter:profiles!counted_by(full_name))`;

async function rpc(fn: string, args: object): Promise<Result<null, string>> {
  const { error } = await supabase.rpc(fn, args);
  return error ? { ok: false, error: error.message } : { ok: true, value: null };
}

export const supabaseInventoryCountRepository: IInventoryCountRepository = {
  async list(): Promise<Result<InventoryCount[], string>> {
    const { data, error } = await supabase.from("inventory_counts").select(LIST).is("deleted_at", null).order("created_at", { ascending: false });
    return error ? { ok: false, error: error.message } : { ok: true, value: (data as unknown as CountRow[]).map((r) => toCount(r, false)) };
  },
  async getById(id): Promise<InventoryCount | null> {
    const { data } = await supabase.from("inventory_counts").select(DETAIL).eq("id", id).single();
    return data ? toCount(data as unknown as CountRow, true) : null;
  },
  async create(d): Promise<Result<string, string>> {
    const { data, error } = await supabase.rpc("create_inventory_count", { p_count_type: d.countType, p_category_id: d.categoryId, p_assigned_to: d.assignedTo, p_blind: d.blindCount, p_notes: d.notes || null, p_item_ids: d.itemIds.length ? d.itemIds : null });
    return error ? { ok: false, error: error.message } : { ok: true, value: data as string };
  },
  recordLine(lineId, countedQty, notes) { return rpc("record_count_line", { p_line_id: lineId, p_counted_qty: countedQty, p_notes: notes || null }); },
  approveLines(countId, lineIds, action) { return rpc("approve_count_lines", { p_count_id: countId, p_line_ids: lineIds, p_action: action }); },
  apply(countId) { return rpc("apply_inventory_count", { p_count_id: countId }); },
  async cancel(countId): Promise<Result<null, string>> {
    const { error } = await supabase.from("inventory_counts").update({ status: "cancelled" }).eq("id", countId).in("status", ["draft", "in_progress"]);
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
};
