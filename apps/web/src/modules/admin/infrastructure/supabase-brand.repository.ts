import { supabase } from "@shared/lib/supabase";
import { uploadBrandAsset } from "@shared/lib/upload-brand-asset";
import type { RepoResult } from "@admin/domain/admin.types";
import type { IBrandRepository, TenantIdentity } from "@admin/domain/brand.types";

const BUCKET = "brand";
const ok = (e: { message: string } | null): RepoResult => (e ? { ok: false, error: e.message } : { ok: true });

// URL pública del asset {kind}.* del tenant (bucket público). Null si no existe. Soporta png/jpg/webp/svg.
async function assetUrl(tenantId: string, kind: "logo" | "favicon"): Promise<string | null> {
  const { data: files } = await supabase.storage.from(BUCKET).list(tenantId);
  const f = ((files as { name: string }[] | null) ?? []).find((x) => x.name.startsWith(`${kind}.`));
  return f ? supabase.storage.from(BUCKET).getPublicUrl(`${tenantId}/${f.name}`).data.publicUrl : null;
}

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
    const r = await uploadBrandAsset(tenantId, "logo", file);  // delega en el helper compartido
    return r.ok ? { ok: true } : { ok: false, error: r.error };
  },
  logoUrl(tenantId): Promise<string | null> { return assetUrl(tenantId, "logo"); },
  faviconUrl(tenantId): Promise<string | null> { return assetUrl(tenantId, "favicon"); },
  async getTheme(): Promise<Record<string, string | null>> {
    const { data } = await supabase.from("tenant_themes").select("*").limit(1);  // RLS acota al tenant actual
    return (data as Record<string, string | null>[] | null)?.[0] ?? {};
  },
  async saveTheme(tenantId, fields): Promise<RepoResult> {
    return ok((await supabase.from("tenant_themes").update(fields).eq("tenant_id", tenantId)).error);
  },
};
