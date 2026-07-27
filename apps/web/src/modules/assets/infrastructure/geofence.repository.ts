import { supabase } from "@shared/lib/supabase";

// Geocercas (GPS-4). Escrituras directas gateadas por RLS (assets.edit + tenant). Detección la hace el trigger DB.
export interface Geofence {
  id: string; name: string; description: string; centerLat: number | null; centerLng: number | null;
  radiusMeters: number | null; triggerOn: string; appliesToAll: boolean; active: boolean; color: string;
}
export interface GeofenceEventRow { id: string; assetName: string; geofenceName: string; eventType: string; recordedAt: string }
const num = (v: unknown): number | null => (v == null ? null : Number(v));
const one = (v: unknown): string => { const x = v as { name?: string } | { name?: string }[] | null; return (Array.isArray(x) ? x[0]?.name : x?.name) ?? "—"; };

export async function listGeofences(): Promise<Geofence[]> {
  const { data } = await supabase.from("geofences").select("id, name, description, center_lat, center_lng, radius_meters, trigger_on, applies_to_all_assets, active, color").order("created_at");
  return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({
    id: r.id as string, name: (r.name as string) ?? "", description: (r.description as string) ?? "",
    centerLat: num(r.center_lat), centerLng: num(r.center_lng), radiusMeters: num(r.radius_meters),
    triggerOn: (r.trigger_on as string) ?? "both", appliesToAll: r.applies_to_all_assets !== false,
    active: r.active !== false, color: (r.color as string) ?? "royalblue",
  }));
}
export async function saveGeofence(id: string | null, p: Record<string, unknown>): Promise<string | null> {
  const q = id ? supabase.from("geofences").update(p).eq("id", id) : supabase.from("geofences").insert(p);
  return (await q).error?.message ?? null;
}
export async function deleteGeofence(id: string): Promise<void> { await supabase.from("geofences").delete().eq("id", id); }

export async function listGeofenceEvents(): Promise<GeofenceEventRow[]> {
  const { data } = await supabase.from("geofence_events").select("id, event_type, recorded_at, asset:tenant_assets(name), geofence:geofences(name)").order("recorded_at", { ascending: false }).limit(50);
  return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({
    id: r.id as string, assetName: one(r.asset), geofenceName: one(r.geofence), eventType: (r.event_type as string) ?? "", recordedAt: (r.recorded_at as string) ?? "",
  }));
}
