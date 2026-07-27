import { supabase } from "@shared/lib/supabase";

// Perfiles de dispositivo (MDM básico, GPS-4). Lectura/edición gateada por RLS (assets.edit).
export interface DeviceProfile {
  id: string; employeeName: string; deviceName: string; platform: string; model: string;
  gpsInterval: number; offlineBuffer: number; wakeLock: boolean; cameraOn: boolean;
  lastSeenAt: string | null; battery: number | null; active: boolean;
}
const one = (v: unknown): string => { const x = v as { full_name?: string } | { full_name?: string }[] | null; return (Array.isArray(x) ? x[0]?.full_name : x?.full_name) ?? "—"; };

export async function listDevices(): Promise<DeviceProfile[]> {
  const { data } = await supabase.from("device_profiles")
    .select("id, device_name, platform, model, gps_interval_seconds, offline_buffer_size, wake_lock_enabled, camera_enabled, last_seen_at, last_battery_pct, active, employee:profiles(full_name)")
    .order("device_name");
  return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({
    id: r.id as string, employeeName: one(r.employee), deviceName: (r.device_name as string) ?? "", platform: (r.platform as string) ?? "—", model: (r.model as string) ?? "",
    gpsInterval: Number(r.gps_interval_seconds ?? 30), offlineBuffer: Number(r.offline_buffer_size ?? 10000),
    wakeLock: r.wake_lock_enabled !== false, cameraOn: r.camera_enabled !== false,
    lastSeenAt: (r.last_seen_at as string) ?? null, battery: r.last_battery_pct == null ? null : Number(r.last_battery_pct), active: r.active !== false,
  }));
}
export async function updateDeviceConfig(id: string, cfg: { gps_interval_seconds: number; offline_buffer_size: number; wake_lock_enabled: boolean; camera_enabled: boolean }): Promise<void> {
  await supabase.from("device_profiles").update(cfg).eq("id", id);
}
