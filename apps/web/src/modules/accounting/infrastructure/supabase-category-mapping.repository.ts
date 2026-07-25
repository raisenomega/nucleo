import { supabase } from "@shared/lib/supabase";
import type { CategoryMapping, ICategoryMappingRepository } from "@accounting/domain/category-mapping.types";
import type { Result } from "@accounting/domain/chart-of-accounts.types";

type Row = Record<string, unknown>;
const s = (v: unknown) => (v as string | null) ?? null;

function toMapping(r: Row): CategoryMapping {
  return { categoryId: r.category_id as string, kind: r.kind as "expense" | "income", label: r.label as string,
    expenseClass: s(r.expense_class), accountId: s(r.account_id), accountCode: s(r.account_code), accountName: s(r.account_name),
    resolvedCode: r.resolved_code as string, isManual: r.is_manual as boolean, isCatchall: r.is_catchall as boolean };
}

export const supabaseCategoryMappingRepository: ICategoryMappingRepository = {
  async list(): Promise<CategoryMapping[]> {
    const { data } = await supabase.rpc("get_category_mappings");
    return ((data as Row[] | null) ?? []).map(toMapping);
  },
  async setAccount(categoryId, accountId): Promise<Result<null, string>> {
    const { error } = await supabase.from("categories").update({ account_id: accountId }).eq("id", categoryId);
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
  async autoMap(tenantId): Promise<Result<{ mapped: number; remaining: number }, string>> {
    const { data, error } = await supabase.rpc("auto_map_categories", { p_tenant_id: tenantId });
    if (error) return { ok: false, error: error.message };
    const d = (data as { mapped?: number; remaining?: number } | null) ?? {};
    return { ok: true, value: { mapped: d.mapped ?? 0, remaining: d.remaining ?? 0 } };
  },
};
