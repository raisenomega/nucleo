import { totalDistance, metersToMiles, type GeoPoint } from "@shared/lib/geo";
import type { GpsLog } from "@assets/domain/asset.types";

export interface GpsMetrics { points: number; miles: number; avgSpeed: number; minutes: number; avgAccuracy: number; geo: GeoPoint[] }

// Filtra al último recorrido (custody_log_id más reciente) y calcula distancia/velocidad/tiempo.
export function computeGpsMetrics(logs: readonly GpsLog[]): GpsMetrics | null {
  const last = logs[logs.length - 1];
  if (!last) return null;
  const trip = logs.filter((l) => l.custodyLogId === last.custodyLogId);
  const first = trip[0], end = trip[trip.length - 1];
  if (!first || !end) return null;
  const geo: GeoPoint[] = trip.map((l) => ({ lat: l.latitude, lng: l.longitude }));
  const miles = metersToMiles(totalDistance(geo));
  const t0 = new Date(first.recordedAt).getTime(), t1 = new Date(end.recordedAt).getTime();
  const minutes = Math.max(0, (t1 - t0) / 60000);
  const avgSpeed = minutes > 0 ? miles / (minutes / 60) : 0;
  const accs = trip.map((l) => l.accuracy ?? 0).filter((a) => a > 0);
  const avgAccuracy = accs.length ? accs.reduce((s, a) => s + a, 0) / accs.length : 0;
  return { points: trip.length, miles, avgSpeed, minutes, avgAccuracy, geo };
}
