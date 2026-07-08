import { supabase } from "@shared/lib/supabase";
import type { RepoResult } from "@admin/domain/admin.types";
import type { IBrandRepository, TenantIdentity } from "@admin/domain/brand.types";

const BUCKET = "brand";
const ok = (e: { message: string } | null): RepoResult => (e ? { ok: false, error: e.message } : { ok: true });

export const supabaseBrandRepository: IBrandRepository = {
  async getIdentity(): Promise<TenantIdentity | null> {
    const { data } = await supabase.from("tenants").select("legal_name,display_name").limit(1);
    const row = (data as { legal_name: string; display_name: string | null }[] | null)?.[0];
    return row ? { legalName: row.legal_name, displayName: row.display_name ?? "" } : null;
  },
  async updateIdentity(legalName, displayName): Promise<RepoResult> {
    return ok((await supabase.rpc("update_tenant_identity", { p_legal_name: legalName, p_display_name: displayName })).error);
  },
  async uploadLogo(tenantId, file): Promise<RepoResult> {
    // Path fijo {tenant}/logo.png — es el que lee el pdf-api para el header del PDF.
    const { error } = await supabase.storage.from(BUCKET).upload(`${tenantId}/logo.png`, file, { upsert: true, contentType: file.type || "image/png" });
    return ok(error);
  },
  async logoUrl(tenantId): Promise<string | null> {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(`${tenantId}/logo.png`, 3600);
    return data?.signedUrl ?? null;
  },
};
