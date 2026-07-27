import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { GpsMap } from "@assets/presentation/GpsMap";
import type { Geofence } from "@assets/infrastructure/geofence.repository";

// Form de geocerca (círculo): inputs + preview del círculo en vivo. Colores CSS con nombre (sin hex).
const COLORS = ["royalblue", "seagreen", "crimson", "orange"];

export function GeofenceForm({ initial, onSave, onClose }: { initial?: Geofence; onSave: (f: Record<string, unknown>) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState(initial?.name ?? "");
  const [lat, setLat] = useState(String(initial?.centerLat ?? 18.4));
  const [lng, setLng] = useState(String(initial?.centerLng ?? -66.05));
  const [radius, setRadius] = useState(String(initial?.radiusMeters ?? 1000));
  const [trigger, setTrigger] = useState(initial?.triggerOn ?? "both");
  const [color, setColor] = useState(initial?.color ?? "royalblue");
  const nLat = Number(lat), nLng = Number(lng), nR = Number(radius);
  const valid = name.trim() !== "" && !Number.isNaN(nLat) && !Number.isNaN(nLng) && nR > 0;
  const inp = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? initial.name : t("newGeofence")}</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name")} className={inp} />
        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs text-muted-foreground">Lat<input value={lat} onChange={(e) => setLat(e.target.value)} className={inp} /></label>
          <label className="text-xs text-muted-foreground">Lng<input value={lng} onChange={(e) => setLng(e.target.value)} className={inp} /></label>
          <label className="text-xs text-muted-foreground">{t("radiusMeters")}<input value={radius} onChange={(e) => setRadius(e.target.value)} className={inp} /></label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className={`${inp} w-auto`}>
            <option value="enter">{t("tEnter")}</option><option value="exit">{t("tExit")}</option><option value="both">{t("tBoth")}</option>
          </select>
          {COLORS.map((c) => <button key={c} type="button" onClick={() => setColor(c)} style={{ background: c }} aria-label={c}
            className={`h-7 w-7 rounded-full ${color === c ? "ring-2 ring-foreground ring-offset-2" : ""}`} />)}
        </div>
        {valid && <GpsMap center={[nLat, nLng]} circles={[{ lat: nLat, lng: nLng, radius: nR, color }]} height="260px" />}
        <div className="flex gap-2">
          <button type="button" disabled={!valid} onClick={() => onSave({ name: name.trim(), center_lat: nLat, center_lng: nLng, radius_meters: nR, trigger_on: trigger, color, applies_to_all_assets: true })}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("save")}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-foreground">{t("cancel")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
