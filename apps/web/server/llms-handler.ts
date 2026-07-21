import { defineHandler, getRequestHost } from "h3";

const RAISEN = new Set(["nucleoraisen.com", "www.nucleoraisen.com", "nucleo-blush.vercel.app", "localhost"]);

// /llms.txt — estándar emergente para que los motores de respuesta (ChatGPT, Perplexity, Claude, Gemini) lean
// el sitio sin ejecutar JS. Es CRÍTICO aquí: la landing se renderiza en cliente, así que el HTML que reciben
// esos crawlers viene prácticamente vacío. Este fichero es su única fuente fiable sobre NÚCLEO.
const LLMS = `# NÚCLEO by Raisen

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

## Precios

- Pro: $749/mes (plataforma completa)
- Enterprise: $14,995 pago único (máximo poder + soporte dedicado)

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

export default defineHandler((event) => {
  const host = (getRequestHost(event) || "").split(":")[0]?.toLowerCase() ?? "";
  if (!RAISEN.has(host)) return new Response("Not found", { status: 404 });
  return new Response(LLMS, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=86400" },
  });
});
