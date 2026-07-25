import { useState } from "react";
import { BookOpen } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useBrand } from "@shared/providers/BrandProvider";
import { useToast } from "@shared/providers/toast-context";
import { supabase } from "@shared/lib/supabase";

// Toggle de contabilidad de partida doble (solo CEO). Al activar, set_gl_enabled seedea el plan de cuentas.
export function GlToggleCard() {
  const { t } = useI18n();
  const brand = useBrand();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  async function toggle(next: boolean) {
    if (next === brand.glEnabled || saving) return;
    if (next && !window.confirm(t("enableGLWarning"))) return;
    setSaving(true);
    const { error } = await supabase.rpc("set_gl_enabled", { p_enabled: next });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    brand.reload();
    toast.success(next ? t("glEnabledMsg") : t("glDisabledMsg"));
  }
  return (
    <div className="max-w-md space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-bold text-foreground"><BookOpen className="h-4 w-4" />{t("doubleEntryAccounting")}</div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={brand.glEnabled} disabled={saving} onChange={(e) => void toggle(e.target.checked)} />
        {brand.glEnabled ? t("glEnabled") : t("glDisabled")}
      </label>
      <p className="text-xs text-muted-foreground">{t("enableGLHint")}</p>
    </div>
  );
}
