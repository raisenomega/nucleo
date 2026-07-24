import { defineHandler, getRequestHost, getRequestHeader } from "h3";
import { getSeoData, type SeoTier, type SeoAddon } from "@shared/seo/seo-data";
import { trackAiCrawl } from "@shared/analytics/track-server";

const RAISEN = new Set(["nucleoraisen.com", "www.nucleoraisen.com", "nucleo-blush.vercel.app", "localhost"]);

const per = (p: string) => (p === "one_time" ? " (pago único)" : p === "year" ? "/año" : "/mes");
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

// Bloque de precios generado desde la DB: si el owner cambia una tarifa en /web/precios, este fichero la
// refleja sin tocar código. Fallback estático solo si Supabase no responde.
function pricing(tiers: SeoTier[], addons: SeoAddon[]): string {
  const t = tiers.map((x) => `- ${x.nameEs}: ${money(x.price)}${per(x.period)}`).join("\n");
  const a = addons.map((x) => `- ${x.nameEs}: ${money(x.price)}${per(x.period)}`).join("\n");
  return `## Precios\n\n${t}\n\nTodos los planes incluyen usuarios ilimitados y un setup de implementación de $3,500 (una sola vez).\n\n## Complementos\n\n${a}\n`;
}

const FALLBACK_PRICING = `## Precios

- Starter: $249/mes
- Pro: $449/mes (recomendado)
- Enterprise: $649/mes

Todos los planes incluyen usuarios ilimitados y un setup de implementación de $3,500 (una sola vez).
`;

const HEAD = `# NÚCLEO by Raisen

> Plataforma de gestión operacional SaaS para PYMEs y empresas grandes en Puerto Rico y Latinoamérica.
> Simplifica sistemas empresariales complejos en soluciones accesibles y escalables.

## Qué es NÚCLEO

NÚCLEO es una plataforma que integra gestión departamental completa — facturación, operaciones de campo,
talento humano, cumplimiento fiscal, presencia digital y automatización con IA — en un solo sistema bajo la
marca del cliente. Se adapta a cualquier industria y nicho: desde operaciones de servicio hasta manufactura,
retail, logística y más. Es el tipo de plataforma que antes requería implementaciones millonarias, ahora
accesible para cualquier empresa que necesite operar con estructura.

## Módulos

- Facturación inteligente: cotizaciones → aprobación pública → auto-factura → cobro → PDFs white-label
- Rutas y operaciones: paradas asignadas, evidencia fotográfica, completar desde móvil
- Nómina y talento: empleados, contratistas, deducciones automáticas, evaluaciones 360°
- Fiscal PR: motor de contribución con reglas versionadas, alertas de informativas
- Landing white-label: catálogo, SEO, APP nativa bajo dominio del cliente (premium)
- Agentes IA: asistentes entrenados en el negocio del cliente (voz, chat, datos reales)
- Reportes: 4 pilares (ventas, empleados, finanzas, marketing)
- Gestión documental: contratos, vencimientos, alertas automáticas
- Auto-contabilidad: operaciones → registros financieros sin intervención

`;

const TAIL = `
## Para quién

PYMEs y empresas grandes de cualquier industria en Puerto Rico y Latinoamérica que necesitan estructura
departamental, gestión integrada y digitalización de operaciones — sin la complejidad ni el costo de los
sistemas empresariales tradicionales.

## Contacto

- Web: https://www.nucleoraisen.com
- Email: ventas@raisen.agency
- Demo: https://www.nucleoraisen.com/demo
- Detalle extendido: https://www.nucleoraisen.com/llms-full.txt

## Ubicación

San Juan, Puerto Rico
`;

// /llms.txt — canal principal para los motores de respuesta (ChatGPT, Perplexity, Claude, Gemini), que NO
// ejecutan JS: el HTML de la landing les llega prácticamente vacío, así que este fichero es su fuente real.
export default defineHandler(async (event) => {
  const host = (getRequestHost(event) || "").split(":")[0]?.toLowerCase() ?? "";
  if (!RAISEN.has(host)) return new Response("Not found", { status: 404 });
  void trackAiCrawl({ user_agent: getRequestHeader(event, "user-agent"), host, path: "/llms.txt", resource: "llms" });
  const seo = await getSeoData();
  const body = HEAD + (seo ? pricing(seo.tiers, seo.addons) : FALLBACK_PRICING) + TAIL;
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=300" },
  });
});
