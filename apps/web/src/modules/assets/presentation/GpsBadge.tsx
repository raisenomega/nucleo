import { useI18n } from "@shared/i18n";
import { useLiveGps } from "@assets/presentation/useLiveGps.hook";
import { gpsAgeSeconds } from "@assets/infrastructure/live-gps";

// Indicador en fila: verde pulsante (transmitiendo <2min) o rojo (GPS activo, sin datos recientes).
export function GpsBadge({ assetId }: { assetId: string }) {
  const { t } = useI18n();
  const pos = useLiveGps(assetId, true);
  const live = pos ? gpsAgeSeconds(pos.recordedAt) < 120 : false;
  return (
    <span title={live ? t("gpsTracking") : t("gpsSearching")} className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-green-500" : "bg-red-500"}`} />GPS
    </span>
  );
}
