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
