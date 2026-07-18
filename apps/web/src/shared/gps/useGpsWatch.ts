import { useEffect, useRef, useState } from "react";
import { flushGpsLogs, type GpsPointInput } from "@shared/gps/gps.repository";
import type { GpsActive } from "@shared/gps/gps-session";

export type GpsStatus = "idle" | "tracking" | "searching";
const FLUSH_MS = 30000;

// watchPosition mientras haya custodia activa: bufferiza puntos y los descarga en lote cada 30s.
export function useGpsWatch(active: GpsActive | null): GpsStatus {
  const [status, setStatus] = useState<GpsStatus>("idle");
  const buffer = useRef<GpsPointInput[]>([]);
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !navigator.geolocation) { setStatus("idle"); return; }
    setStatus("searching");
    const onPos = (pos: GeolocationPosition) => {
      setStatus("tracking");
      const c = pos.coords;
      buffer.current.push({
        asset_id: active.assetId, custody_log_id: active.custodyLogId,
        latitude: c.latitude, longitude: c.longitude, speed: c.speed, heading: c.heading,
        accuracy: c.accuracy, recorded_at: new Date(pos.timestamp).toISOString(),
      });
    };
    const flush = () => { const b = buffer.current; buffer.current = []; if (b.length) void flushGpsLogs(b); };
    const watchId = navigator.geolocation.watchPosition(onPos, () => setStatus("searching"), { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 });
    const iv = setInterval(flush, FLUSH_MS);
    return () => { navigator.geolocation.clearWatch(watchId); clearInterval(iv); flush(); setStatus("idle"); };
  }, [active]);
  return status;
}
