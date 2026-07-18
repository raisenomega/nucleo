import { useEffect, useState } from "react";
import { MapPin, Check, HelpCircle } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { gmapsDirUrl, passedNear, type GeoPoint } from "@shared/lib/geo";
import type { RouteStop } from "@operations/domain/route.types";

// Cruce GPS × paradas: recorrido del vehículo ese día + verifica si pasó cerca de cada parada (<200m).
export function RouteGpsVerify({ assetId, routeDate, stops }: { assetId: string; routeDate: string; stops: readonly RouteStop[] }) {
  const { t } = useI18n();
  const [track, setTrack] = useState<GeoPoint[]>([]);
  useEffect(() => {
    void supabase.from("asset_gps_logs").select("latitude, longitude").eq("asset_id", assetId)
      .gte("recorded_at", `${routeDate}T00:00:00`).lte("recorded_at", `${routeDate}T23:59:59`).order("recorded_at")
      .then(({ data }) => setTrack(((data as { latitude: number; longitude: number }[] | null) ?? []).map((r) => ({ lat: Number(r.latitude), lng: Number(r.longitude) }))));
  }, [assetId, routeDate]);
  const located = stops.filter((s) => s.lat != null && s.lng != null);
  if (track.length === 0 && located.length === 0) return null;
  return (
    <div className="space-y-1 border-t border-border p-4 pt-3">
      <p className="text-xs font-bold uppercase text-muted-foreground">{t("gpsTrack")}</p>
      {track.length > 1 && <a href={gmapsDirUrl(track)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary"><MapPin className="h-4 w-4" />{t("viewRouteMap")}</a>}
      {located.map((s) => {
        const ok = track.length > 0 && passedNear(track, { lat: s.lat as number, lng: s.lng as number });
        return <div key={s.id} className="flex items-center gap-1.5 text-sm">{ok ? <Check className="h-4 w-4 text-green-600" /> : <HelpCircle className="h-4 w-4 text-yellow-600" />}<span>{s.clientName}</span><span className="text-muted-foreground">· {ok ? t("stopVerified") : t("stopUnverified")}</span></div>;
      })}
    </div>
  );
}
