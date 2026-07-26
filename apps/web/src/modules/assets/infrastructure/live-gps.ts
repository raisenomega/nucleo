import { supabase } from "@shared/lib/supabase";
import type { GeoPoint } from "@shared/lib/geo";

// Lecturas SOLO-LECTURA de asset_gps_logs para la vista en vivo. NO toca el tracking.
export interface LivePosition { lat: number; lng: number; speed: number | null; accuracy: number | null; recordedAt: string }

export async function latestGpsLog(assetId: string): Promise<LivePosition | null> {
  const { data } = await supabase.from("asset_gps_logs").select("latitude, longitude, speed, accuracy, recorded_at").eq("asset_id", assetId).order("recorded_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  const r = data as Record<string, unknown>;
  return { lat: Number(r.latitude), lng: Number(r.longitude), speed: r.speed == null ? null : Number(r.speed), accuracy: r.accuracy == null ? null : Number(r.accuracy), recordedAt: (r.recorded_at as string) ?? "" };
}

export async function todayGpsTrack(assetId: string, day: string): Promise<GeoPoint[]> {
  const { data } = await supabase.from("asset_gps_logs").select("latitude, longitude").eq("asset_id", assetId).gte("recorded_at", `${day}T00:00:00`).lte("recorded_at", `${day}T23:59:59`).order("recorded_at");
  return ((data as { latitude: number; longitude: number }[] | null) ?? []).map((p) => ({ lat: Number(p.latitude), lng: Number(p.longitude) }));
}

// Antigüedad en segundos del último punto (para el semáforo transmitiendo/perdido).
export const gpsAgeSeconds = (recordedAt: string): number => (Date.now() - new Date(recordedAt).getTime()) / 1000;

// Último reporte GPS por activo (para la tabla de flota). Una sola query, se queda con el más reciente por asset.
export async function lastReportByAsset(assetIds: string[]): Promise<Record<string, string>> {
  if (assetIds.length === 0) return {};
  const { data } = await supabase.from("asset_gps_logs").select("asset_id, recorded_at").in("asset_id", assetIds).order("recorded_at", { ascending: false });
  const out: Record<string, string> = {};
  ((data as { asset_id: string; recorded_at: string }[] | null) ?? []).forEach((r) => { if (!out[r.asset_id]) out[r.asset_id] = r.recorded_at; });
  return out;
}
