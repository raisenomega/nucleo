import { Navigation } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useGps } from "@shared/gps/gps-context";

// Indicador en el header: punto verde pulsante (rastreando) o amarillo (buscando señal).
export function GpsIndicator() {
  const { t } = useI18n();
  const { status, active } = useGps();
  if (status === "idle") return null;
  const tracking = status === "tracking";
  return (
    <span title={`${tracking ? t("gpsTracking") : t("gpsSearching")} — ${active?.assetName ?? ""}`} className="flex items-center gap-1.5 text-xs font-semibold">
      <Navigation className={`h-3.5 w-3.5 ${tracking ? "text-green-500" : "text-yellow-500"}`} />
      <span className={`h-2 w-2 rounded-full ${tracking ? "animate-pulse bg-green-500" : "bg-yellow-500"}`} />
      <span className="hidden text-muted-foreground sm:inline">{active?.assetName}</span>
    </span>
  );
}
