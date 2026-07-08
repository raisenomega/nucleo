import { useCallback, useEffect, useState } from "react";
import { supabaseBrandRepository } from "@admin/infrastructure/supabase-brand.repository";
import { AdminBrandIdentity } from "@admin/presentation/AdminBrandIdentity";
import { AdminBrandStyle } from "@admin/presentation/AdminBrandStyle";
import { AdminTemplatesInfo } from "@admin/presentation/AdminTemplatesInfo";
import type { TenantIdentity } from "@admin/domain/brand.types";
import type { SettingEntry, RepoResult } from "@admin/domain/admin.types";

// Tab Plantillas (solo ceo): identidad + colores + plantillas PDF. Branding que consume el pdf-api.
export function AdminBrandTab({ tenantId, settings, onSaveSetting }: {
  tenantId: string; settings: readonly SettingEntry[];
  onSaveSetting: (key: string, value: string) => Promise<RepoResult>;
}) {
  const repo = supabaseBrandRepository;
  const [identity, setIdentity] = useState<TenantIdentity | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const load = useCallback(async () => {
    const [id, url] = await Promise.all([repo.getIdentity(), repo.logoUrl(tenantId)]);
    setIdentity(id); setLogoUrl(url);
  }, [repo, tenantId]);
  useEffect(() => { void load(); }, [load]);

  const get = (k: string) => settings.find((s) => s.key === k)?.value ?? "";
  const saveMany = async (fields: Record<string, string>): Promise<RepoResult> => {
    const rs = await Promise.all(Object.entries(fields).map(([k, v]) => onSaveSetting(k, v)));
    return rs.find((r) => !r.ok) ?? { ok: true };
  };
  const saveIdentity = async (legal: string, display: string, fields: Record<string, string>): Promise<RepoResult> => {
    const r = await repo.updateIdentity(legal, display);
    if (!r.ok) return r;
    const r2 = await saveMany(fields);
    await load();
    return r2;
  };
  const uploadLogo = async (file: File) => {
    const r = await repo.uploadLogo(tenantId, file);
    if (!r.ok) { window.alert(r.error); return; }
    setLogoUrl(await repo.logoUrl(tenantId));
  };
  return (
    <div className="max-w-2xl space-y-6">
      <AdminBrandIdentity identity={identity} logoUrl={logoUrl} get={get} onUploadLogo={uploadLogo} onSave={saveIdentity} />
      <AdminBrandStyle get={get} logoUrl={logoUrl} companyName={identity?.displayName || identity?.legalName || ""} onSave={saveMany} />
      <AdminTemplatesInfo />
    </div>
  );
}
