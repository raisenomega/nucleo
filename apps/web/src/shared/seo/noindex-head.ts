// Head mínimo para documentos privados servidos por token público (comprobantes, facturas, estados de cuenta,
// solicitudes de empleo). Defensa en profundidad: robots.txt evita el RASTREO, este meta evita el INDEXADO —
// robots.txt por sí solo no impide que Google liste la URL si alguien la enlaza desde fuera.
//
// A propósito NO reusa seoHead(): ese helper inyecta SITE_NAME/SITE_URL/OG_IMAGE de la landing comercial de
// NÚCLEO, y estas páginas se sirven bajo el dominio del TENANT — meterle marca y canonical de nucleoraisen.com
// a la factura de un cliente rompería el white-label además de emitir un canonical falso.
export const noindexHead = () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] });
