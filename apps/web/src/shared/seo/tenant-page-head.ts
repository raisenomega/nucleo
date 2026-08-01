import { hostKind, currentHost } from "@shared/seo/host";
import { fetchTenantSeo, type TenantSeo } from "@shared/seo/tenant-seo.repository";

// Head SSR para páginas INTERIORES de la landing de un tenant (/catalog, /service/$slug, /preguntas-frecuentes).
//
// Por qué existe: el root declara `title: "Núcleo"` como default, y toda ruta que no emita su propio head lo
// heredaba. Un humano nunca lo veía —apply-branding.ts:20 reescribe document.title tras hidratar— pero el
// crawler lee el HTML de SSR, así que 7 URLs del sitemap se anunciaban con el título del default.
//
// El root NO puede resolver el tenant: es un createRootRoute sin loader y sirve también al panel y al dominio
// comercial, donde la marca de un tenant sería incorrecta. De ahí que el título se componga por ruta.

// En SSR resuelve el tenant por host; en cliente devuelve null (el head ya viajó en el HTML) y en los hosts
// de NÚCLEO también, para no emitir marca de tenant donde no toca.
export async function loadTenantSeo(): Promise<TenantSeo | null> {
  if (typeof window !== "undefined") return null;
  if (hostKind() !== "tenant") return null;
  return fetchTenantSeo(currentHost());
}

// Compone «{título de la página} · {marca}». Sin marca resuelta cae al título a secas, que es preferible a
// inventarse una. `canonical` se pasa cuando la página tiene una versión preferida distinta de sí misma.
export function tenantPageHead(pageTitle: string, seo?: TenantSeo | null, canonical?: string | null) {
  const brand = seo?.title?.trim();
  const title = brand ? `${pageTitle} · ${brand}` : pageTitle;
  const meta: Record<string, string>[] = [
    { title },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "robots", content: "index, follow, max-image-preview:large" },
  ];
  if (seo?.description) {
    meta.push({ name: "description", content: seo.description },
      { property: "og:description", content: seo.description });
  }
  const links = canonical ? [{ rel: "canonical", href: canonical }] : [];
  return { meta, links };
}

// Origen del tenant a partir del canonical que ya devuelve el RPC (https://www.dominio/). Evita reconstruirlo
// a mano y con ello repetir el bug del prefijo `app.` que hubo en los correos.
export function tenantOrigin(seo?: TenantSeo | null): string | null {
  if (!seo?.canonical) return null;
  try { return new URL(seo.canonical).origin; } catch { return null; }
}
