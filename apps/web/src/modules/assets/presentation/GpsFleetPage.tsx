import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useAssets } from "@assets/application/useAssets.hook";
import { supabaseAssetRepository } from "@assets/infrastructure/supabase-asset.repository";
import { lastReportByAsset } from "@assets/infrastructure/live-gps";
import { GpsFleetTable } from "@assets/presentation/GpsFleetTable";
import { AssetMapView } from "@assets/presentation/AssetMapView";

// Página GPS: filtro directo de activos con gps_enabled, orientado a monitoreo. Reusa la capa de datos existente.
export function GpsFleetPage() {
  const { t } = useI18n();
  const assets = useAssets(supabaseAssetRepository);
  const rows = useMemo(() => assets.items.filter((a) => a.gpsEnabled), [assets.items]);
  const [last, setLast] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<string | null>(null);
  useEffect(() => { if (rows.length) void lastReportByAsset(rows.map((a) => a.id)).then(setLast); }, [rows]);
  const view = rows.find((a) => a.id === viewing);
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("gps")}</h1>
      <GpsFleetTable rows={rows} lastReport={last} onMap={setViewing} />
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
