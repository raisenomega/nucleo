import { supabase } from "@shared/lib/supabase";
import { currentHost } from "@shared/seo/host";

// Datos mínimos del servicio para el head SSR de /service/$slug: el nombre (para el <title>) y si tiene
// página dedicada (`landing_hero` configurado en el CMS, que se sirve en /servicios/{slug}). Se reusa el RPC
// anon que ya existe en vez de añadir uno nuevo; sólo se leen dos campos del payload.
export interface LandingServiceSeo { name: string; tienePaginaRica: boolean }

export async function fetchLandingServiceSeo(slug: string): Promise<LandingServiceSeo | null> {
  const { data } = await supabase.rpc("_public_get_landing_service", {
    _hostname: currentHost(), _service_slug: slug,
  });
  const svc = (data as { service?: { name?: string; landing_hero?: unknown } } | null)?.service;
  if (!svc?.name) return null;
  return { name: svc.name, tienePaginaRica: svc.landing_hero != null };
}
