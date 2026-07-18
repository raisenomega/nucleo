import { supabase } from "@shared/lib/supabase";

// Punto GPS listo para el RPC batch (una sola llamada con los puntos acumulados).
export interface GpsPointInput {
  asset_id: string; custody_log_id: string;
  latitude: number; longitude: number;
  speed: number | null; heading: number | null; accuracy: number | null; recorded_at: string;
}

export async function flushGpsLogs(logs: GpsPointInput[]): Promise<boolean> {
  if (logs.length === 0) return true;
  const { error } = await supabase.rpc("batch_insert_gps_logs", { p_logs: logs });
  return !error;
}
