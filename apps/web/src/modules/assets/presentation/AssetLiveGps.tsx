import { useEffect, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { gmapsDirUrl, type GeoPoint } from "@shared/lib/geo";
import { useLiveGps } from "@assets/presentation/useLiveGps.hook";
import { todayGpsTrack, gpsAgeSeconds } from "@assets/infrastructure/live-gps";

// Sección "Ubicación en vivo" (in_use + gps): última posición con auto-refresh 30s + links a mapa. Read-only.
export function AssetLiveGps({ assetId }: { assetId: string }) {
  const { t } = useI18n();
  const pos = useLiveGps(assetId, true);
  const [track, setTrack] = useState<GeoPoint[]>([]);
  useEffect(() => { void todayGpsTrack(assetId, new Date().toISOString().slice(0, 10)).then(setTrack); }, [assetId, pos?.recordedAt]);
  const age = pos ? gpsAgeSeconds(pos.recordedAt) : Infinity;
  const live = age < 120;
  const btn = "inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-bold text-foreground";
  return (
    <div className="space-y-2 border-t border-border pt-2">
      <p className="flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground"><Navigation className="h-4 w-4" />{t("liveLocation")}
        <span className={`ml-1 h-2 w-2 rounded-full ${live ? "animate-pulse bg-green-500" : "bg-gray-400"}`} />
        <span className="font-normal normal-case">{live ? t("trackingLive") : t("noRecentData")}</span></p>
      {pos ? <>
        <p className="text-sm">{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)} · {t("updatedAgo")}: {Math.round(age)}s</p>
        <p className="text-sm text-muted-foreground">{t("currentSpeed")}: {pos.speed != null ? (pos.speed * 3.6).toFixed(0) : "—"} km/h · {t("accuracy")}: ±{pos.accuracy != null ? pos.accuracy.toFixed(0) : "—"}m</p>
        <div className="flex flex-wrap gap-2">
          <a href={`https://www.google.com/maps?q=${pos.lat},${pos.lng}`} target="_blank" rel="noopener noreferrer" className={btn}><MapPin className="h-4 w-4" />{t("viewOnMap")}</a>
          {track.length > 1 && <a href={gmapsDirUrl(track)} target="_blank" rel="noopener noreferrer" className={btn}><MapPin className="h-4 w-4" />{t("viewDayRoute")}</a>}
        </div>
      </> : <p className="text-sm text-muted-foreground">{t("noRecords")}</p>}
    </div>
  );
}
