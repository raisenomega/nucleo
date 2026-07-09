import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { useBrand } from "@shared/providers/brand-context";
import { useThemesForm } from "@admin/application/useThemesForm.hook";
import { supabaseBrandRepository } from "@admin/infrastructure/supabase-brand.repository";
import { ThemeSection } from "@admin/presentation/ThemeSection";
import { ThemeIdentitySection } from "@admin/presentation/ThemeIdentitySection";
import { ThemeColorsSection } from "@admin/presentation/ThemeColorsSection";
import { ThemeModeSection } from "@admin/presentation/ThemeModeSection";

// Tab Temas (/settings): identidad + colores + modo, con preview en vivo y Guardar/Cancelar. Solo ceo.
export function AdminThemesTab({ tenantId }: { tenantId: string }) {
  const { t } = useI18n();
  const { reload } = useBrand();
  const m = useThemesForm(tenantId, supabaseBrandRepository);
  const [open, setOpen] = useState("identity");
  useEffect(() => () => reload(), [reload]);  // al desmontar sin guardar: re-aplica el tema persistido
  const toggle = (s: string) => setOpen((o) => (o === s ? "" : s));
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-primary">{t("themesTitle")}</h2>
        <p className="text-xs text-muted-foreground">{t("themesSubtitle")}</p>
      </div>
      <ThemeSection title={t("identityHeader")} open={open === "identity"} onToggle={() => toggle("identity")}>
        <ThemeIdentitySection displayName={m.form.display_name} legalName={m.form.legal_name} logoUrl={m.logoUrl}
          faviconUrl={m.faviconUrl} onField={m.set} onUpload={(k, f) => void m.uploadAsset(k, f)} />
      </ThemeSection>
      <ThemeSection title={t("colorsHeader")} open={open === "colors"} onToggle={() => toggle("colors")}>
        <ThemeColorsSection colors={m.form} onChange={m.set} onRestore={m.restoreColors} />
      </ThemeSection>
      <ThemeSection title={t("defaultModeHeader")} open={open === "mode"} onToggle={() => toggle("mode")}>
        <ThemeModeSection mode={m.form.default_mode} onChange={(v) => m.set("default_mode", v)} />
      </ThemeSection>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={m.cancel} disabled={!m.dirty}
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold disabled:opacity-40">{t("cancelBtn")}</button>
        <button type="button" onClick={() => void m.save()} disabled={!m.dirty || m.busy}
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-40">{t("saveBtn")}</button>
      </div>
    </div>
  );
}
