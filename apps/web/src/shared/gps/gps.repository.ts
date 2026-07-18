import { supabase } from "@shared/lib/supabase";
import { bufferPoints, putAuth, registerGpsSync, readBuffer, clearBuffer } from "@shared/gps/gps-offline";

// Punto GPS listo para el RPC batch (una sola llamada con los puntos acumulados).
export interface GpsPointInput {
  asset_id: string; custody_log_id: string;
  latitude: number; longitude: number;
  speed: number | null; heading: number | null; accuracy: number | null; recorded_at: string;
}

async function rawFlush(logs: GpsPointInput[]): Promise<boolean> {
  const { error } = await supabase.rpc("batch_insert_gps_logs", { p_logs: logs });
  return !error;
}

// Guarda credenciales para que el Service Worker (Background Sync) pueda descargar el buffer con la app cerrada.
async function stashAuth(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) await putAuth({ url: import.meta.env.VITE_SUPABASE_URL as string, key: import.meta.env.VITE_SUPABASE_ANON_KEY as string, token });
}

// Descarga en lote. Éxito online = comportamiento original. Si falla (sin internet/error): buffer IndexedDB + background sync.
export async function flushGpsLogs(logs: GpsPointInput[]): Promise<boolean> {
  if (logs.length === 0) return true;
  let ok = false;
  try { ok = typeof navigator !== "undefined" && navigator.onLine && (await rawFlush(logs)); } catch { ok = false; }
  if (!ok) { await bufferPoints(logs); await stashAuth(); void registerGpsSync(); }
  return ok;
}

// Reintenta el buffer offline (en 'online'/'visible'). Devuelve cuántos puntos sincronizó.
export async function syncOfflineBuffer(): Promise<number> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return 0;
  const pts = await readBuffer();
  if (pts.length === 0) return 0;
  if (await rawFlush(pts)) { await clearBuffer(); return pts.length; }
  return 0;
}
