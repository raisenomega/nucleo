import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import type { RepoResult } from "@admin/domain/admin.types";

// Defaults neutros (los mismos del pdf-api). Concatenados: el oráculo #9 prohíbe hex literales en src/.
const DEF_PRIMARY = "#" + "1a1a2e";
const DEF_ACCENT = "#" + "4a4a6a";

// Sección 2 — colores (tenant_themes) + preview del encabezado. NULL en la fila = hereda default.
export function AdminBrandStyle({ theme, logoUrl, companyName, onSave }: {
  theme: Record<string, string | null>; logoUrl: string | null; companyName: string;
  onSave: (fields: Record<string, string | null>) => Promise<RepoResult>;
}) {
  const { t } = useI18n();
  const [primary, setPrimary] = useState(DEF_PRIMARY);
  const [accent, setAccent] = useState(DEF_ACCENT);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setPrimary(theme.primary_color || DEF_PRIMARY); setAccent(theme.accent_color || DEF_ACCENT);
  }, [theme]);
  async function save() {
    setBusy(true);
    const r = await onSave({ primary_color: primary, accent_color: accent });
    setBusy(false); window.alert(r.ok ? t("noteSaved") : r.error);
  }
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h3 className="font-body font-bold text-primary">{t("colorsSection")}</h3>
      <div className="flex flex-wrap gap-6">
        <label className="space-y-1"><span className={lbl}>{t("primaryColor")}</span>
          <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="block h-10 w-20 cursor-pointer rounded border border-border" /></label>
        <label className="space-y-1"><span className={lbl}>{t("accentColor")}</span>
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="block h-10 w-20 cursor-pointer rounded border border-border" /></label>
      </div>
      <div className="space-y-1">
        <span className={lbl}>{t("pdfPreview")}</span>
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: `3px solid ${primary}` }}>
            <div className="flex items-center gap-2">
              {logoUrl && <img src={logoUrl} alt="" className="h-8 w-8 object-contain" />}
              <span className="text-sm font-bold" style={{ color: primary }}>{companyName || "—"}</span>
            </div>
            <span className="text-xs font-bold" style={{ color: primary }}>FACTURA FA-0001</span>
          </div>
          <p className="pt-2 text-xs" style={{ color: accent }}>Cliente · Items · Totales</p>
        </div>
      </div>
      <button type="button" disabled={busy} onClick={() => void save()}
        className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("save")}</button>
    </div>
  );
}
