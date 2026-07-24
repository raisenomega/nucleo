import { defineHandler, getRequestHost, getRequestHeader } from "h3";
import { trackAiCrawl } from "@shared/analytics/track-server";

const RAISEN = new Set(["nucleoraisen.com", "www.nucleoraisen.com", "nucleo-blush.vercel.app", "localhost"]);

// Rutas del panel y del CMS: nunca deben indexarse en ningún host. Van tal cual a robots.txt.
const PANEL = [
  "/dashboard", "/settings", "/settings-team", "/login", "/registro", "/pin", "/invite", "/aprobar",
  "/tenants", "/web/", "/leads", "/customers", "/quotes", "/billing", "/income", "/expenses", "/payroll",
  "/reports", "/route", "/routes", "/agenda", "/assets", "/documents", "/inventory", "/orders", "/marketing",
  "/notifications", "/observations", "/evaluations", "/extraordinary", "/reconciliation", "/recurring",
  "/support", "/training", "/accounts-receivable", "/portal", "/glass-demo",
];
// Rutas de la landing de TENANT — en el host comercial de NÚCLEO no renderizan nada útil: fuera del índice.
const TENANT_ONLY = ["/catalog", "/product/", "/service/", "/servicios/", "/package/", "/privacy", "/terms"];

const block = (paths: string[]) => paths.map((p) => `Disallow: ${p}`).join("\n");

// robots.txt servido por host. En el dominio comercial apunta al sitemap de NÚCLEO; en el dominio de un tenant
// se emite un robots neutro (sin sitemap ni rastro de NÚCLEO) que solo protege el panel — white-label intacto.
export default defineHandler((event) => {
  const host = (getRequestHost(event) || "").split(":")[0]?.toLowerCase() ?? "";
  const isRaisen = RAISEN.has(host);
  void trackAiCrawl({ user_agent: getRequestHeader(event, "user-agent"), host, path: "/robots.txt", resource: "robots" });
  const body = isRaisen
    ? `User-agent: *\nAllow: /\n${block([...PANEL, ...TENANT_ONLY])}\n\nSitemap: https://www.nucleoraisen.com/sitemap.xml\n`
    : `User-agent: *\nAllow: /\n${block(PANEL)}\n`;
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=86400" },
  });
});
