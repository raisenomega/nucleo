import { defineHandler, getRequestHost } from "h3";
import { getSeoData, type SeoData } from "@shared/seo/seo-data";

const RAISEN = new Set(["nucleoraisen.com", "www.nucleoraisen.com", "nucleo-blush.vercel.app", "localhost"]);

const per = (p: string) => (p === "one_time" ? " (pago único)" : p === "year" ? "/año" : "/mes");
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const HEAD = `# NÚCLEO by Raisen — documentación extendida

> Plataforma de gestión operacional SaaS para PYMEs y empresas grandes en Puerto Rico y Latinoamérica.

## Propuesta de valor

NÚCLEO simplifica sistemas empresariales complejos (gestión departamental de nivel corporativo) en una
solución accesible, escalable y white-label. Toda la operación vive en un panel: ventas, campo, talento,
finanzas, cumplimiento fiscal y presencia digital. El cliente opera bajo su propia marca y su propio dominio.

## Cómo funciona (4 pasos)

1. Solicita acceso — Cuéntanos sobre tu negocio y te activamos en minutos.
2. Configura tu marca — Logo, colores, dominio propio: tu plataforma, tu identidad.
3. Opera tu negocio — Factura, asigna rutas, gestiona empleados, todo desde un solo panel.
4. Crece con datos — Reportes, fiscal, IA: decisiones informadas para escalar.

## Soluciones

- Agente contable IA — Un agente entrenado en las reglas fiscales de PR, México y Colombia: registra,
  concilia y avisa antes de cada vencimiento.
- Plataforma completa — Un solo sistema para toda la operación: nómina, reportes, documentos y landing
  white-label propia.
- Para tu negocio — Opera todo bajo tu propia marca: facturación, rutas, equipo y fiscal en un solo
  sistema, en tu dominio.
- Para agencias y partners — Revende NÚCLEO como tu producto: ofrece la plataforma a tus clientes bajo tu
  marca y tu margen.

## Módulos completos

- Facturación inteligente: cotizaciones, aprobación pública por enlace, auto-factura, cobro, PDFs white-label
- Rutas y operaciones: paradas asignadas, evidencia fotográfica, cierre desde móvil
- Nómina y talento: empleados, contratistas, deducciones automáticas, evaluaciones 360°
- Fiscal PR: motor de contribución con reglas versionadas, alertas de informativas
- Landing white-label: catálogo, SEO, APP nativa bajo dominio del cliente (premium)
- Agentes IA: asistentes entrenados en el negocio del cliente (voz, chat, datos reales)
- Reportes: 4 pilares — ventas, empleados, finanzas, marketing
- Gestión documental: contratos, vencimientos, alertas automáticas
- Auto-contabilidad: operaciones → registros financieros sin intervención

`;

const TAIL = `
## Contacto

- Web: https://www.nucleoraisen.com
- Email: ventas@raisen.agency
- Demo: https://www.nucleoraisen.com/demo
- Ubicación: San Juan, Puerto Rico
`;

// Precios y FAQs salen de la DB (marketing_pricing_* y marketing_faqs). Las FAQs son LAS MISMAS que se ven
// en la landing y que se publican como FAQPage, así las tres superficies nunca se contradicen.
function dynamicBody(seo: SeoData): string {
  const tiers = seo.tiers.map((t) => `- ${t.nameEs} — ${money(t.price)}${per(t.period)}`).join("\n");
  const addons = seo.addons.map((a) => `- ${a.nameEs} — ${money(a.price)}${per(a.period)}`).join("\n");
  const faqs = seo.faqs.map((f) => `P: ${f.qEs}\nR: ${f.aEs}\n`).join("\n");
  return `## Precios

Todos los planes incluyen usuarios ilimitados y un setup de implementación de $3,500 (una sola vez), que
cubre configuración de marca, migración de datos, entrenamiento y acompañamiento post-lanzamiento.

${tiers}

## Complementos

${addons}

## Preguntas frecuentes

${faqs}`;
}

const FALLBACK = `## Precios

- Starter — $249/mes
- Pro — $449/mes (recomendado)
- Enterprise — $649/mes

Todos los planes incluyen usuarios ilimitados y un setup de implementación de $3,500 (una sola vez).
`;

export default defineHandler(async (event) => {
  const host = (getRequestHost(event) || "").split(":")[0]?.toLowerCase() ?? "";
  if (!RAISEN.has(host)) return new Response("Not found", { status: 404 });
  const seo = await getSeoData();
  const body = HEAD + (seo ? dynamicBody(seo) : FALLBACK) + TAIL;
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=300" },
  });
});
