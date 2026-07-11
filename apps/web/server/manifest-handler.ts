import { defineHandler, getRequestHost } from "h3";

const ICON = (src: string, sizes: string) => ({ src, sizes, type: "image/png", purpose: "any maskable" });
const DEFAULT_ICONS = [ICON("/icons/icon-192.png", "192x192"), ICON("/icons/icon-512.png", "512x512")];
// Fallback: manifest estático del panel (marca NÚCLEO) si el host no resuelve a un tenant con landing.
const PANEL = {
  name: "NÚCLEO by raisen", short_name: "NÚCLEO", start_url: "/dashboard", scope: "/",
  display: "standalone", background_color: "#0f0d0a", theme_color: "#EEA62B", icons: DEFAULT_ICONS,
};

interface Tenant { display_name: string; primary_color: string; accent_color: string; logo_url: string | null; default_language?: string; }
function tenantManifest(b: Tenant) {
  const icons = b.logo_url ? [ICON(b.logo_url, "192x192"), ICON(b.logo_url, "512x512")] : DEFAULT_ICONS;
  return {
    name: b.display_name, short_name: String(b.display_name).slice(0, 12), description: `Sitio oficial de ${b.display_name}`,
    start_url: "/", scope: "/", display: "standalone", orientation: "portrait",
    theme_color: b.accent_color, background_color: b.primary_color,
    icons, categories: ["business", "services"], lang: b.default_language || "es",
  };
}

// Manifest PWA dinámico por hostname (Nitro handler → URL HTTP real, requisito de instalabilidad Chrome).
export default defineHandler(async (event) => {
  const host = (getRequestHost(event) || "").replace(/^www\./, "").split(":")[0];
  const url = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_ANON_KEY;
  let brand: Tenant | null = null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/_public_resolve_tenant_by_host`, {
      method: "POST", headers: { apikey: key as string, authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ _hostname: host }),
    });
    const d = await res.json() as (Tenant & { status?: string }) | null;
    if (d && !d.status && d.display_name) brand = d;
  } catch { /* fallback al panel */ }
  return new Response(JSON.stringify(brand ? tenantManifest(brand) : PANEL), {
    status: 200,
    headers: { "content-type": "application/manifest+json", "cache-control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" },
  });
});
