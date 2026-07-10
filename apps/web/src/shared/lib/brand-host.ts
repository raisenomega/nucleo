import { supabase } from "@shared/lib/supabase";

// Branding resuelto por hostname (RPC brand_by_hostname de la migración 125). Pre-login.
export interface HostBrand {
  tenant_id: string | null; display_name: string; legal_name: string | null;
  primary_color: string; accent_color: string; logo_url: string | null; favicon_url: string | null;
  contact_phone: string | null; is_fallback: boolean; is_raisen?: boolean; status?: string;
}
// Colores neutros del fallback en rgb() (no hex) — solo si la RPC falla; el server ya devuelve su propio fallback.
export const HOST_FALLBACK: HostBrand = {
  tenant_id: null, display_name: "Portal", legal_name: "Portal", primary_color: "rgb(31,41,55)",
  accent_color: "rgb(55,65,81)", logo_url: null, favicon_url: null, contact_phone: null, is_fallback: true,
};
const KEY = "nucleo:host-brand:v1"; const TTL = 24 * 3600 * 1000;
const RAISEN_HOSTS = new Set(["nucleoraisen.com", "www.nucleoraisen.com", "nucleo-blush.vercel.app", "localhost"]);

// Dominios operacionales de Raisen (producto). Fuera de esta lista = dominio de tenant → rutas de producto redirigen.
export function isRaisenHost(): boolean {
  if (typeof window === "undefined") return true; // SSR: no redirige; el cliente reevalúa
  return RAISEN_HOSTS.has(window.location.hostname);
}

export async function brandByHostname(hostname: string): Promise<HostBrand> {
  const { data } = await supabase.rpc("brand_by_hostname", { _hostname: hostname });
  return (data as HostBrand | null) ?? HOST_FALLBACK;
}

export function readHostBrand(): HostBrand | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY); if (!raw) return null;
    const { brand, ts } = JSON.parse(raw) as { brand: HostBrand; ts: number };
    return Date.now() - ts < TTL ? brand : null;
  } catch { return null; }
}
export function writeHostBrand(brand: HostBrand): void {
  try { localStorage.setItem(KEY, JSON.stringify({ brand, ts: Date.now() })); } catch { /* noop */ }
}
