import { SITE_NAME, SITE_URL, OG_IMAGE } from "@shared/seo/site.constants";

interface SeoOpts {
  title: string; description: string; path: string; // path con "/" inicial
  ogTitle?: string; noindex?: boolean; hreflang?: boolean; keywords?: string;
}
type Meta = Record<string, string>;

// Construye meta + links para una página pública de la landing comercial. Un solo sitio donde vive el formato
// (OG, Twitter, canonical, hreflang) para que ninguna página se quede a medias.
export function seoHead(o: SeoOpts): { meta: Meta[]; links: Meta[] } {
  const url = `${SITE_URL}${o.path === "/" ? "/" : o.path}`;
  const ogTitle = o.ogTitle ?? o.title;
  const meta: Meta[] = [
    { title: o.title },
    { name: "description", content: o.description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: o.description },
    { property: "og:image", content: OG_IMAGE },
    { property: "og:locale", content: "es_PR" },
    { property: "og:locale:alternate", content: "en_US" },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: ogTitle },
    { name: "twitter:description", content: o.description },
    { name: "twitter:image", content: OG_IMAGE },
  ];
  if (o.keywords) meta.push({ name: "keywords", content: o.keywords });
  // Legales: se sirven a usuarios pero no aportan al ranking y diluyen el crawl budget → noindex, follow.
  meta.push({ name: "robots", content: o.noindex ? "noindex, follow" : "index, follow, max-image-preview:large" });

  const links: Meta[] = [{ rel: "canonical", href: url }];
  // Clave en minúscula a propósito: el serializador de head emite los atributos literales (HTML5 los trata
  // case-insensitive, pero "hreflang" es la forma canónica que esperan los validadores).
  if (o.hreflang) links.push(
    { rel: "alternate", hreflang: "es", href: url },
    { rel: "alternate", hreflang: "en", href: `${url}?lang=en` },
    { rel: "alternate", hreflang: "x-default", href: url },
  );
  return { meta, links };
}
