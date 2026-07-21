import { supabase } from "@shared/lib/supabase";
import type { DeductionRule, DeductionRuleDraft } from "@finance/domain/deduction-rule.types";

const COLS = "id, label, applies_to, calc_type, rate, base_source, wage_cap, per_employee, frequency, country_code, notes, sort, active";

// Reglas de deducción del tenant (RLS por tenant). El editor gatea la ruta con can("payroll","edit").
export const deductionRulesRepository = {
  async list(): Promise<DeductionRule[]> {
    const { data } = await supabase.from("payroll_deduction_rules").select(COLS).order("sort");
    return (data as DeductionRule[] | null) ?? [];
  },
  async save(d: DeductionRuleDraft): Promise<string | null> {
    const { id, ...row } = d;
    const res = id
      ? await supabase.from("payroll_deduction_rules").update(row).eq("id", id)
      : await supabase.from("payroll_deduction_rules").insert(row);
    return res.error ? res.error.message : null;
  },
  async remove(id: string): Promise<string | null> {
    return (await supabase.from("payroll_deduction_rules").delete().eq("id", id)).error?.message ?? null;
  },
  async setFields(id: string, patch: Partial<Pick<DeductionRule, "active" | "sort">>): Promise<string | null> {
    return (await supabase.from("payroll_deduction_rules").update(patch).eq("id", id)).error?.message ?? null;
  },
  // Siembra las 10 reglas fiscales estándar de PR (para tenants con 0 reglas). RPC SECURITY DEFINER existente.
  async restorePreset(): Promise<string | null> {
    const { data: t } = await supabase.rpc("current_tenant");
    return (await supabase.rpc("seed_pr_payroll_preset", { tid: t })).error?.message ?? null;
  },
};
