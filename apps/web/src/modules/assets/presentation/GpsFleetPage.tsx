import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@shared/i18n";
import { useBrand } from "@shared/providers/brand-context";
import { useSession } from "@shared/providers/SessionProvider";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useAssets } from "@assets/application/useAssets.hook";
import { useGpsRealtime } from "@assets/presentation/useGpsRealtime.hook";
import { supabaseAssetRepository } from "@assets/infrastructure/supabase-asset.repository";
import { lastReportByAsset } from "@assets/infrastructure/live-gps";
import { listGeofences, type Geofence } from "@assets/infrastructure/geofence.repository";
import { GpsFleetTable } from "@assets/presentation/GpsFleetTable";
import { GpsFleetMap } from "@assets/presentation/GpsFleetMap";
import { GpsFleetSummary } from "@assets/presentation/GpsFleetSummary";
import { GeofencesTab } from "@assets/presentation/GeofencesTab";
import { DevicesTab } from "@assets/presentation/DevicesTab";
import { AssetMapView } from "@assets/presentation/AssetMapView";

const TABS = ["map", "list", "fences", "devices"] as const;
type Tab = (typeof TABS)[number];

// Monitoreo GPS (premium): mapa de flota en vivo + geocercas + lista. Sin flag: solo la lista (polling GPS-1).
export function GpsFleetPage() {
  const { t } = useI18n();
  const { gpsRealtimeEnabled } = useBrand();
  const { session } = useSession();
  const assets = useAssets(supabaseAssetRepository);
  const rows = useMemo(() => assets.items.filter((a) => a.gpsEnabled), [assets.items]);
  const { positions, isConnected } = useGpsRealtime(session?.tenantId ?? "", gpsRealtimeEnabled);
  const [tab, setTab] = useState<Tab>(gpsRealtimeEnabled ? "map" : "list");
  const [last, setLast] = useState<Record<string, string>>({});
  const [fences, setFences] = useState<Geofence[]>([]);
  const [showFences, setShowFences] = useState(true);
  const [viewing, setViewing] = useState<string | null>(null);
  useEffect(() => { if (rows.length) void lastReportByAsset(rows.map((a) => a.id)).then(setLast); }, [rows]);
  useEffect(() => { void listGeofences().then(setFences); }, []);
  const circles = useMemo(() => (showFences ? fences : []).filter((g) => g.active && g.centerLat != null && g.centerLng != null && g.radiusMeters)
    .map((g) => ({ lat: g.centerLat as number, lng: g.centerLng as number, radius: g.radiusMeters as number, color: g.color })), [fences, showFences]);
  const view = rows.find((a) => a.id === viewing);
  const label = (k: Tab) => (k === "map" ? t("fleetMap") : k === "list" ? t("unitsList") : k === "fences" ? t("geofences") : t("devices"));
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("gps")}</h1>
        {gpsRealtimeEnabled && tab === "map" && <GpsFleetSummary positions={positions} isConnected={isConnected} />}
      </div>
      {gpsRealtimeEnabled && (
        <div className="flex flex-wrap items-center gap-1 border-b border-border">
          {TABS.map((k) => <button key={k} type="button" onClick={() => setTab(k)} className={`px-3 py-2 text-sm font-bold ${tab === k ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}>{label(k)}</button>)}
          {tab === "map" && <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" checked={showFences} onChange={(e) => setShowFences(e.target.checked)} />{t("showGeofences")}</label>}
        </div>
      )}
      {!gpsRealtimeEnabled || tab === "list" ? <GpsFleetTable rows={rows} lastReport={last} onMap={setViewing} />
        : tab === "fences" ? <GeofencesTab />
        : tab === "devices" ? <DevicesTab />
        : <GpsFleetMap positions={positions} geofences={circles} />}
      {view && <ScreenModal onClose={() => setViewing(null)}><div className="space-y-3 p-4 md:p-6"><h2 className="font-display text-lg font-bold text-foreground">{view.name}</h2><AssetMapView assetId={view.id} live={view.status === "in_use"} height="480px" /></div></ScreenModal>}
    </div>
  );
}
