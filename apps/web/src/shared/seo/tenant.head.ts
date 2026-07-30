import type { TenantSeo } from "@shared/seo/tenant-seo.repository";

// Head SEO de la landing white-label de un TENANT (ruta "/" en su dominio). A diferencia de landingHead (que
// devuelve {} fuera de los hosts de NÚCLEO), este SÍ emite <title>/description/canonical/OG del tenant en SSR,
// para que Google no indexe el default "Portal" del root. Marca del tenant, nunca de NÚCLEO.
export function tenantLandingHead(seo?: TenantSeo | null) {
  if (!seo) return {};
  const meta: Record<string, string>[] = [
    { title: seo.title },
    { name: "description", content: seo.description },
    { property: "og:type", content: "website" },
    { property: "og:title", content: seo.title },
    { property: "og:description", content: seo.description },
    { property: "og:url", content: seo.canonical },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: seo.title },
    { name: "twitter:description", content: seo.description },
    { name: "robots", content: "index, follow, max-image-preview:large" },
  ];
  if (seo.image) {
    meta.push({ property: "og:image", content: seo.image }, { name: "twitter:image", content: seo.image });
  }
  return { meta, links: [{ rel: "canonical", href: seo.canonical }] };
}
