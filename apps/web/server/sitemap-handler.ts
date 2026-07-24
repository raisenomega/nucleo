import { defineHandler, getRequestHost, getRequestHeader } from "h3";
import { trackAiCrawl } from "@shared/analytics/track-server";

const RAISEN = new Set(["nucleoraisen.com", "www.nucleoraisen.com", "nucleo-blush.vercel.app", "localhost"]);
const BASE = "https://www.nucleoraisen.com";

const url = (loc: string, freq: string, pri: string, lastmod?: string, alt = false) =>
  `  <url>\n    <loc>${loc}</loc>\n` +
  (alt ? `    <xhtml:link rel="alternate" hreflang="es" href="${loc}"/>\n` +
         `    <xhtml:link rel="alternate" hreflang="en" href="${loc}?lang=en"/>\n` +
         `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>\n` : "") +
  (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : "") +
  `    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`;

// Legales activas desde la DB (marketing_legal_pages tiene RLS pública de lectura → basta la anon key).
async function legalUrls(): Promise<string> {
  const base = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_ANON_KEY;
  try {
    const res = await fetch(`${base}/rest/v1/marketing_legal_pages?select=slug,updated_at&is_active=eq.true&order=slug`, {
      headers: { apikey: key as string, authorization: `Bearer ${key}` },
    });
    const rows = await res.json() as { slug: string; updated_at: string | null }[];
    if (!Array.isArray(rows)) return "";
    return rows.map((r) => "\n" + url(`${BASE}/legal/${r.slug}`, "yearly", "0.3", r.updated_at?.slice(0, 10))).join("");
  } catch { return ""; } // sin DB, el sitemap sigue siendo válido con las rutas estáticas
}

// sitemap.xml solo para el dominio comercial. En un dominio de tenant devuelve 404 a propósito: su robots.txt
// tampoco lo referencia, así que nadie lo pide — y así jamás se le atribuyen URLs de NÚCLEO a un tenant.
export default defineHandler(async (event) => {
  const host = (getRequestHost(event) || "").split(":")[0]?.toLowerCase() ?? "";
  if (!RAISEN.has(host)) return new Response("Not found", { status: 404 });
  void trackAiCrawl({ user_agent: getRequestHeader(event, "user-agent"), host, path: "/sitemap.xml", resource: "sitemap" });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${url(`${BASE}/`, "weekly", "1.0", undefined, true)}
${url(`${BASE}/demo`, "monthly", "0.8")}${await legalUrls()}
</urlset>
`;
  return new Response(body, {
    status: 200,
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=86400" },
  });
});
