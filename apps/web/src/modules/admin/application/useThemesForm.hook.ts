import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { previewTheme, type TenantTheme } from "@shared/lib/theme-vars";
import { useBrand } from "@shared/providers/brand-context";
import { uploadBrandAsset } from "@shared/lib/upload-brand-asset";
import type { IBrandRepository } from "@admin/domain/brand.types";

export const COLOR_KEYS = ["primary_color", "secondary_color", "accent_color", "sidebar_bg", "sidebar_text",
  "sidebar_hover", "danger_color", "success_color", "warning_color"] as const;
export interface ThemesForm { display_name: string; legal_name: string; default_mode: string | null; [k: string]: string | null; }
const BLANK: ThemesForm = { display_name: "", legal_name: "", default_mode: null, primary_color: null, secondary_color: null,
  accent_color: null, sidebar_bg: null, sidebar_text: null, sidebar_hover: null, danger_color: null, success_color: null, warning_color: null };

const toTheme = (f: ThemesForm): TenantTheme => ({
  primaryColor: f.primary_color ?? null, secondaryColor: f.secondary_color ?? null, accentColor: f.accent_color ?? null,
  sidebarBg: f.sidebar_bg ?? null, sidebarText: f.sidebar_text ?? null, sidebarHover: f.sidebar_hover ?? null,
  dangerColor: f.danger_color ?? null, successColor: f.success_color ?? null, warningColor: f.warning_color ?? null, defaultMode: f.default_mode,
});

export function useThemesForm(tenantId: string, repo: IBrandRepository) {
  const { t } = useI18n();
  const brand = useBrand();
  const [form, setForm] = useState<ThemesForm>(BLANK);
  const [saved, setSaved] = useState<ThemesForm>(BLANK);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const [id, th, lo, fa] = await Promise.all([repo.getIdentity(), repo.getTheme(), repo.logoUrl(tenantId), repo.faviconUrl(tenantId)]);
    const f: ThemesForm = { ...BLANK, display_name: id?.displayName ?? "", legal_name: id?.legalName ?? "", default_mode: th.default_mode ?? null };
    for (const k of COLOR_KEYS) f[k] = th[k] ?? null;
    setForm(f); setSaved(f); setLogoUrl(lo); setFaviconUrl(fa);
  }, [tenantId, repo]);
  useEffect(() => { void load(); }, [load]);
  const apply = (f: ThemesForm) => previewTheme(toTheme(f));
  const set = (k: string, v: string | null) => setForm((p) => { const n = { ...p, [k]: v }; apply(n); return n; });
  const restoreColors = () => setForm((p) => { const n = { ...p }; for (const k of COLOR_KEYS) n[k] = null; apply(n); return n; });
  const cancel = () => { setForm(saved); apply(saved); };
  const uploadAsset = async (kind: "logo" | "favicon", file: File) => {
    const r = await uploadBrandAsset(tenantId, kind, file, t);
    if (!r.ok) return void window.alert(r.error);
    await repo.saveTheme(tenantId, { [`${kind}_url`]: r.publicUrl });
    if (kind === "logo") setLogoUrl(r.publicUrl); else setFaviconUrl(r.publicUrl);
    brand.reload();
  };
  const save = async () => {
    setBusy(true);
    const r1 = await repo.updateIdentity(form.legal_name, form.display_name);
    if (!r1.ok) return void (setBusy(false), window.alert(t("saveErrorFull")));
    const theme: Record<string, string | null> = { default_mode: form.default_mode };
    for (const k of COLOR_KEYS) theme[k] = form[k] ?? null;
    const r2 = await repo.saveTheme(tenantId, theme);
    setBusy(false);
    if (!r2.ok) return void window.alert(t("saveErrorPartial"));
    setSaved(form); brand.reload(); window.alert(t("saveSuccess"));
  };
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  return { form, set, dirty, busy, logoUrl, faviconUrl, restoreColors, cancel, save, uploadAsset };
}
