import { supabase } from "@shared/lib/supabase";

// SEO del landing de un tenant (por hostname), para emitir <title>/meta en SSR. Fallbacks + canonical en el RPC.
export interface TenantSeo { title: string; description: string; image: string | null; canonical: string }

export async function fetchTenantSeo(hostname: string): Promise<TenantSeo | null> {
  const { data } = await supabase.rpc("_public_get_landing_seo", { _hostname: hostname });
  const d = data as (TenantSeo & { status?: string }) | null;
  return d && d.status === "ok" ? { title: d.title, description: d.description, image: d.image, canonical: d.canonical } : null;
}
