import { useState } from "react";
import { Radio } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useBrand } from "@shared/providers/BrandProvider";
import { useToast } from "@shared/providers/toast-context";
import { supabase } from "@shared/lib/supabase";

// Toggle premium de monitoreo GPS en vivo (solo CEO). Activa el mapa de flota + Realtime (set_gps_realtime).
export function GpsRealtimeToggleCard() {
  const { t } = useI18n();
  const brand = useBrand();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  async function toggle(next: boolean) {
    if (next === brand.gpsRealtimeEnabled || saving) return;
    setSaving(true);
    const { error } = await supabase.rpc("set_gps_realtime", { p_enabled: next });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    brand.reload();
    toast.success(t("saved"));
  }
  return (
    <div className="max-w-md space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Radio className="h-4 w-4" />{t("gpsRealtime")}</div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={brand.gpsRealtimeEnabled} disabled={saving} onChange={(e) => void toggle(e.target.checked)} />
        {brand.gpsRealtimeEnabled ? t("liveOn") : t("liveOff")}
      </label>
      <p className="text-xs text-muted-foreground">{t("gpsRealtimeHint")}</p>
    </div>
  );
}
