import { supabase } from "@shared/lib/supabase";
import type { Asset, AssetFormData, MaintenanceLog, MaintenanceFormData, IAssetRepository, Result, AssetType, AssetCondition, AssetStatus, MaintenanceType } from "@assets/domain/asset.types";

const SELECT = "id, name, asset_type, category, serial_number, model, brand, purchase_date, purchase_price, current_value, depreciation_method, depreciation_years, warranty_expires, condition, status, assigned_to, location, insurance_policy, insurance_expires, notes, image_url, is_active, assignee:profiles!tenant_assets_assigned_to_fkey(full_name)";
type Row = Record<string, unknown>;
const s = (v: unknown) => (v as string | null) ?? "";
const n = (v: unknown) => (v == null || v === "" ? null : Number(v));
const toAsset = (r: Row): Asset => ({
  id: r.id as string, name: s(r.name), assetType: r.asset_type as AssetType, category: s(r.category),
  serialNumber: s(r.serial_number), model: s(r.model), brand: s(r.brand),
  purchaseDate: (r.purchase_date as string) ?? null, purchasePrice: n(r.purchase_price), currentValue: n(r.current_value),
  depreciationMethod: s(r.depreciation_method) || "none", depreciationYears: n(r.depreciation_years), warrantyExpires: (r.warranty_expires as string) ?? null,
  condition: r.condition as AssetCondition, status: r.status as AssetStatus,
  assignedTo: (r.assigned_to as string) ?? null, assignedToName: ((r.assignee as { full_name?: string } | null)?.full_name) ?? "",
  location: s(r.location), insurancePolicy: s(r.insurance_policy), insuranceExpires: (r.insurance_expires as string) ?? null,
  notes: s(r.notes), imageUrl: s(r.image_url), active: !!r.is_active,
});
const toRow = (d: AssetFormData) => ({
  name: d.name, asset_type: d.assetType, category: d.category || null, serial_number: d.serialNumber || null, model: d.model || null, brand: d.brand || null,
  purchase_date: d.purchaseDate || null, purchase_price: d.purchasePrice, current_value: d.currentValue,
  depreciation_method: d.depreciationMethod, depreciation_years: d.depreciationYears, warranty_expires: d.warrantyExpires || null,
  condition: d.condition, status: d.status, assigned_to: d.assignedTo, location: d.location || null,
  insurance_policy: d.insurancePolicy || null, insurance_expires: d.insuranceExpires || null, notes: d.notes || null, image_url: d.imageUrl || null, is_active: d.active,
});

export const supabaseAssetRepository: IAssetRepository = {
  async list(): Promise<Result<Asset[], string>> {
    const { data, error } = await supabase.from("tenant_assets").select(SELECT).order("name");
    return error ? { ok: false, error: error.message } : { ok: true, value: (data as Row[]).map(toAsset) };
  },
  async create(d): Promise<Result<Asset, string>> {
    const { data, error } = await supabase.from("tenant_assets").insert(toRow(d)).select(SELECT).single();
    return error || !data ? { ok: false, error: error?.message ?? "error" } : { ok: true, value: toAsset(data as Row) };
  },
  async update(id, d): Promise<Result<Asset, string>> {
    const { data, error } = await supabase.from("tenant_assets").update(toRow(d)).eq("id", id).select(SELECT).single();
    return error || !data ? { ok: false, error: error?.message ?? "error" } : { ok: true, value: toAsset(data as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("tenant_assets").delete().eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
  async listMaintenance(assetId): Promise<MaintenanceLog[]> {
    const { data } = await supabase.from("asset_maintenance_log").select("id, maintenance_type, description, cost, performed_by, performed_at, next_due, notes").eq("asset_id", assetId).order("performed_at", { ascending: false });
    return ((data as Row[] | null) ?? []).map((r) => ({ id: r.id as string, maintenanceType: r.maintenance_type as MaintenanceType, description: s(r.description), cost: Number(r.cost ?? 0), performedBy: s(r.performed_by), performedAt: (r.performed_at as string) ?? "", nextDue: (r.next_due as string) ?? null, notes: s(r.notes) }));
  },
  async addMaintenance(assetId, d): Promise<Result<null, string>> {
    const { error } = await supabase.from("asset_maintenance_log").insert({ asset_id: assetId, maintenance_type: d.maintenanceType, description: d.description || null, cost: d.cost, performed_by: d.performedBy || null, performed_at: d.performedAt || null, next_due: d.nextDue || null, notes: d.notes || null });
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
};
