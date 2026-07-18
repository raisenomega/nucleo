// Persistencia del tracking activo entre navegaciones/recargas (sessionStorage).
export interface GpsActive { assetId: string; custodyLogId: string; assetName: string }
const KEY = "active_gps_tracking";

export function getActiveGps(): GpsActive | null {
  try { const v = sessionStorage.getItem(KEY); return v ? (JSON.parse(v) as GpsActive) : null; } catch { return null; }
}
export function setActiveGps(a: GpsActive): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(a)); } catch { /* SSR / storage bloqueado */ }
}
export function clearActiveGps(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* SSR / storage bloqueado */ }
}
