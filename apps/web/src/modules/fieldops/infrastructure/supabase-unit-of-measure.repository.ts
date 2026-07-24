import { supabase } from "@shared/lib/supabase";
import type { UnitOfMeasure, UomFormData, IUnitOfMeasureRepository, UomGroup } from "@fieldops/domain/unit-of-measure.types";
import type { Result } from "@fieldops/domain/inventory.types";

interface Row {
  id: string; tenant_id: string; name: string; abbreviation: string; uom_group: string;
  base_unit_id: string | null; conversion_factor: number | string | null; is_default: boolean; active: boolean;
}
const SELECT = "id, tenant_id, name, abbreviation, uom_group, base_unit_id, conversion_factor, is_default, active";

function toUom(r: Row): UnitOfMeasure {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name, abbreviation: r.abbreviation, uomGroup: r.uom_group as UomGroup,
    baseUnitId: r.base_unit_id, conversionFactor: r.conversion_factor == null ? null : Number(r.conversion_factor),
    isDefault: r.is_default, active: r.active,
  };
}
function toRow(d: UomFormData) { return { name: d.name, abbreviation: d.abbreviation, uom_group: d.uomGroup, active: d.active }; }

export const supabaseUomRepository: IUnitOfMeasureRepository = {
  async list(): Promise<Result<UnitOfMeasure[], string>> {
    const { data, error } = await supabase.from("units_of_measure").select(SELECT).order("uom_group").order("name");
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: (data as unknown as Row[]).map(toUom) };
  },
  async create(d): Promise<Result<UnitOfMeasure, string>> {
    const { data, error } = await supabase.from("units_of_measure").insert(toRow(d)).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toUom(data as unknown as Row) };
  },
  async update(id, d): Promise<Result<UnitOfMeasure, string>> {
    const { data, error } = await supabase.from("units_of_measure").update(toRow(d)).eq("id", id).select(SELECT).single();
    if (error || !data) return { ok: false, error: error?.message ?? "error" };
    return { ok: true, value: toUom(data as unknown as Row) };
  },
  async remove(id): Promise<Result<null, string>> {
    const { error } = await supabase.from("units_of_measure").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: null };
  },
};
