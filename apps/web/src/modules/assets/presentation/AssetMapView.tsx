import { useEffect, useState } from "react";
import { Navigation } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { GpsMap, type GpsMarker } from "@assets/presentation/GpsMap";
import { useLiveGps } from "@assets/presentation/useLiveGps.hook";
import { todayGpsTrack, gpsAgeSeconds } from "@assets/infrastructure/live-gps";
import { getRouteStopsForAsset, type RouteStopGeo } from "@assets/infrastructure/fleet.repository";
import type { GeoPoint } from "@shared/lib/geo";

// Mapa real (leaflet) por activo: track del día (polyline) + marcadores inicio/fin + posición actual en vivo.
const PR: [number, number] = [18.22, -66.59];
const today = () => new Date().toISOString().slice(0, 10);

export function AssetMapView({ assetId, live, height = "360px" }: { assetId: string; live: boolean; height?: string }) {
  const { t } = useI18n();
  const pos = useLiveGps(assetId, live);
  const [day, setDay] = useState(today());
  const [track, setTrack] = useState<GeoPoint[]>([]);
  const [stops, setStops] = useState<RouteStopGeo[]>([]);
  useEffect(() => { void todayGpsTrack(assetId, day).then(setTrack); }, [assetId, day, pos?.recordedAt]);
  useEffect(() => { void getRouteStopsForAsset(assetId, day).then(setStops); }, [assetId, day]);
  const age = pos ? gpsAgeSeconds(pos.recordedAt) : Infinity;
  const isLive = age < 120;
  const first = track[0], last = track.at(-1);
  const stopColor = (s: string) => (s.startsWith("Completad") ? "seagreen" : s.startsWith("No ") ? "crimson" : "orange");
  const markers: GpsMarker[] = [];
  if (first) markers.push({ lat: first.lat, lng: first.lng, label: t("origin"), color: "seagreen" });
  if (last && track.length > 1) markers.push({ lat: last.lat, lng: last.lng, label: t("destination"), color: "crimson" });
  stops.forEach((s) => { if (s.lat != null && s.lng != null) markers.push({ lat: s.lat, lng: s.lng, label: `#${s.order} ${s.clientName || s.address} · ${s.status}`, color: stopColor(s.status) }); });
  if (pos) markers.push({ lat: pos.lat, lng: pos.lng, label: `${t("currentSpeed")}: ${pos.speed != null ? (pos.speed * 3.6).toFixed(0) : "—"} km/h`, color: "royalblue" });
  const center: [number, number] = pos ? [pos.lat, pos.lng] : first ? [first.lat, first.lng] : PR;
  return (
    <div className="space-y-2 border-t border-border pt-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground"><Navigation className="h-4 w-4" />{t("liveLocation")}
          {live && <><span className={`ml-1 h-2 w-2 rounded-full ${isLive ? "animate-pulse bg-green-500" : "bg-gray-400"}`} /><span className="font-normal normal-case">{isLive ? t("trackingLive") : t("noRecentData")}</span></>}</p>
        <input type="date" value={day} max={today()} onChange={(e) => setDay(e.target.value)} className="ml-auto rounded-lg border border-border bg-background p-1.5 text-sm" />
      </div>
      <GpsMap center={center} zoom={pos ? 13 : 11} markers={markers} track={track} height={height} />
      {pos && <p className="text-xs text-muted-foreground">{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)} · {Math.round(age)}s · ±{pos.accuracy != null ? pos.accuracy.toFixed(0) : "—"}m</p>}
    </div>
  );
}
