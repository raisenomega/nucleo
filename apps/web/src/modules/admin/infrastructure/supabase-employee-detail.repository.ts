import { supabase } from "@shared/lib/supabase";
import type { EmployeeDetail, EmployeeDetailUpdate, IEmployeeDetailRepository } from "@admin/domain/employee-detail.types";
import type { RepoResult } from "@admin/domain/admin.types";

const ok = (error: { message: string } | null): RepoResult => (error ? { ok: false, error: error.message } : { ok: true });

// El type es snake_case (espeja la tabla) → select/upsert pasan directo, sin mapeo de 80 campos.
export const supabaseEmployeeDetailRepository: IEmployeeDetailRepository = {
  async get(profileId): Promise<EmployeeDetail | null> {
    const { data } = await supabase.from("employee_details").select("*").eq("profile_id", profileId).maybeSingle();
    return (data as EmployeeDetail | null) ?? null;
  },
  async upsert(profileId, d: EmployeeDetailUpdate): Promise<RepoResult> {
    // Normaliza "" -> null: inputs date/number vacíos romperían el upsert (invalid input syntax).
    const clean = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]));
    return ok((await supabase.from("employee_details")
      .upsert({ profile_id: profileId, ...clean }, { onConflict: "tenant_id,profile_id" })).error);
  },
};
