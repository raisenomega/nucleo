import { supabase } from "@shared/lib/supabase";
import type { EmployeeDetail, EmployeeDetailUpdate, IEmployeeDetailRepository } from "@admin/domain/employee-detail.types";
import type { RepoResult } from "@admin/domain/admin.types";

const ok = (error: { message: string } | null): RepoResult => (error ? { ok: false, error: error.message } : { ok: true });

// El type es snake_case (espeja la tabla) → select/upsert pasan directo, sin mapeo de 80 campos.
export const supabaseEmployeeDetailRepository: IEmployeeDetailRepository = {
  async get(profileId): Promise<EmployeeDetail | null> {
    const { data } = await supabase.from("employee_details").select("*").eq("profile_id", profileId).maybeSingle();
    if (!data) return null;
    // El SSN ya no vive aquí (migr 221, tabla employee_ssn cifrada). Se descarta el campo legacy que aún
    // devuelve `select *` en la fase expand, para que jamás re-entre al form ni al upsert.
    const { ssn: _ssn, ssn_encrypted: _e, ...rest } = data as Record<string, unknown>;
    return rest as unknown as EmployeeDetail;
  },
  async upsert(profileId, d: EmployeeDetailUpdate): Promise<RepoResult> {
    // Normaliza "" -> null; y descarta ssn/ssn_encrypted por si algún caller los arrastra (contract-safe).
    const clean = Object.fromEntries(Object.entries(d)
      .filter(([k]) => k !== "ssn" && k !== "ssn_encrypted")
      .map(([k, v]) => [k, v === "" ? null : v]));
    return ok((await supabase.from("employee_details")
      .upsert({ profile_id: profileId, ...clean }, { onConflict: "tenant_id,profile_id" })).error);
  },
};
