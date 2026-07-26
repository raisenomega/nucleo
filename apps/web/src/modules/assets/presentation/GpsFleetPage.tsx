import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@shared/i18n";
import { useBrand } from "@shared/providers/brand-context";
import { useSession } from "@shared/providers/SessionProvider";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useAssets } from "@assets/application/useAssets.hook";
import { useGpsRealtime } from "@assets/presentation/useGpsRealtime.hook";
import { supabaseAssetRepository } from "@assets/infrastructure/supabase-asset.repository";
import { lastReportByAsset } from "@assets/infrastructure/live-gps";
import { GpsFleetTable } from "@assets/presentation/GpsFleetTable";
import { GpsFleetMap } from "@assets/presentation/GpsFleetMap";
import { GpsFleetSummary } from "@assets/presentation/GpsFleetSummary";
import { AssetMapView } from "@assets/presentation/AssetMapView";

// Monitoreo GPS. Con gps_realtime_enabled (premium): mapa de flota en vivo + tabs. Sin él: solo la lista (polling).
export function GpsFleetPage() {
  const { t } = useI18n();
  const { gpsRealtimeEnabled } = useBrand();
  const { session } = useSession();
  const assets = useAssets(supabaseAssetRepository);
  const rows = useMemo(() => assets.items.filter((a) => a.gpsEnabled), [assets.items]);
  const { positions, isConnected } = useGpsRealtime(session?.tenantId ?? "", gpsRealtimeEnabled);
  const [tab, setTab] = useState<"map" | "list">(gpsRealtimeEnabled ? "map" : "list");
  const [last, setLast] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<string | null>(null);
  useEffect(() => { if (rows.length) void lastReportByAsset(rows.map((a) => a.id)).then(setLast); }, [rows]);
  const view = rows.find((a) => a.id === viewing);
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("gps")}</h1>
        {gpsRealtimeEnabled && <GpsFleetSummary positions={positions} isConnected={isConnected} />}
      </div>
      {gpsRealtimeEnabled && (
        <div className="flex gap-1 border-b border-border">
          {(["map", "list"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={`px-3 py-2 text-sm font-bold ${tab === k ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}>{k === "map" ? t("fleetMap") : t("unitsList")}</button>))}
        </div>
      )}
      {gpsRealtimeEnabled && tab === "map"
        ? <GpsFleetMap positions={positions} />
        : <GpsFleetTable rows={rows} lastReport={last} onMap={setViewing} />}
      {view && (
        <ScreenModal onClose={() => setViewing(null)}>
          <div className="space-y-3 p-4 md:p-6">
            <h2 className="font-display text-lg font-bold text-foreground">{view.name}</h2>
            <AssetMapView assetId={view.id} live={view.status === "in_use"} height="480px" />
          </div>
        </ScreenModal>
      )}
    </div>
  );
}
