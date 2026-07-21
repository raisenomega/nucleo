import { defineHandler, getRequestHost } from "h3";

const RAISEN = new Set(["nucleoraisen.com", "www.nucleoraisen.com", "nucleo-blush.vercel.app", "localhost"]);

// /llms-full.txt — versión extendida de /llms.txt: proceso, soluciones y FAQs literales. El contenido refleja
// lo que hay en la DB (marketing_process_steps, marketing_solutions, marketing_features) al 2026-07-20.
const LLMS_FULL = `# NÚCLEO by Raisen — documentación extendida

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

## Capacidades destacadas

- Facturación inteligente: cotizaciones → aprobación pública → auto-factura → cobro → PDFs white-label
- Rutas y operaciones: paradas asignadas, evidencia fotográfica, completar desde móvil
- Fiscal y reportes: motor de contribución con reglas versionadas y alertas de informativas
- IA y landing: agentes entrenados en el negocio + landing white-label con APP nativa

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

## Precios

- Pro: $749/mes — plataforma completa con gestión departamental
- Enterprise: $14,995 pago único — máximo poder y soporte dedicado

## Preguntas frecuentes

P: ¿Qué es NÚCLEO?
R: Una plataforma de gestión operacional para PYMEs y empresas grandes. Integra facturación, operaciones,
nómina, fiscal, landing white-label y agentes IA en un solo sistema bajo la marca del cliente. Se adapta a
cualquier industria en Puerto Rico y Latinoamérica.

P: ¿Para qué tipo de empresa es NÚCLEO?
R: Para cualquier empresa que necesite estructura departamental y gestión integrada — desde PYMEs hasta
empresas grandes, en cualquier industria y nicho.

P: ¿Cuánto cuesta NÚCLEO?
R: Dos planes: Pro desde $749/mes y Enterprise con pago único de $14,995. Ambos incluyen la plataforma
completa con gestión departamental.

P: ¿NÚCLEO cumple con la regulación fiscal de Puerto Rico?
R: Sí. Incluye un motor de contribución con reglas versionadas, alertas de informativas y estrategias de
optimización fiscal adaptadas a Puerto Rico.

P: ¿Puedo usar NÚCLEO con mi propia marca?
R: Sí. NÚCLEO es 100% white-label: el cliente final ve tu marca, tu dominio y tu logo.

P: ¿En qué idiomas está disponible?
R: Español e inglés, conmutables en toda la plataforma y en la landing.

## Contacto

- Web: https://www.nucleoraisen.com
- Email: ventas@raisen.agency
- Demo: https://www.nucleoraisen.com/demo
- Ubicación: San Juan, Puerto Rico
`;

export default defineHandler((event) => {
  const host = (getRequestHost(event) || "").split(":")[0]?.toLowerCase() ?? "";
  if (!RAISEN.has(host)) return new Response("Not found", { status: 404 });
  return new Response(LLMS_FULL, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=86400" },
  });
});
