import { supabase } from "@shared/lib/supabase";

// MDM (GPS-4): reporta estado del dispositivo (batería/plataforma) y cachea la config que devuelve report_device_status.
// El tracker (useGpsWatch) lee gpsIntervalMs para el flush; así el CEO cambia el intervalo por dispositivo desde la UI.
let cached = { gpsIntervalMs: 30000, offlineBuffer: 10000 };
export const deviceConfig = () => cached;

async function readBattery(): Promise<number | null> {
  try {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number }> };
    if (!nav.getBattery) return null;
    return Math.round((await nav.getBattery()).level * 100);
  } catch { return null; }
}

export async function reportDeviceStatus(): Promise<void> {
  if (typeof navigator === "undefined") return;
  const ua = navigator.userAgent;
  const platform = /android/i.test(ua) ? "android" : /iphone|ipad/i.test(ua) ? "ios" : "web";
  const { data } = await supabase.rpc("report_device_status", { p_battery_pct: await readBattery(), p_platform: platform });
  const c = data as { gps_interval_seconds?: number; offline_buffer_size?: number } | null;
  if (c) cached = { gpsIntervalMs: (c.gps_interval_seconds ?? 30) * 1000, offlineBuffer: c.offline_buffer_size ?? 10000 };
}
