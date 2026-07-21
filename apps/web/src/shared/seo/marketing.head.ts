import { isRaisenSeoHost } from "@shared/seo/host";
import { seoHead } from "@shared/seo/seo-head";
import { SEO_TITLE, SEO_DESCRIPTION, OG_TITLE, SEO_KEYWORDS, GOOGLE_SITE_VERIFICATION } from "@shared/seo/site.constants";
import { ORG_LD, APP_LD } from "@shared/seo/jsonld.org";
import { FAQ_LD } from "@shared/seo/jsonld.faq";

const ld = (o: unknown) => ({ type: "application/ld+json", children: JSON.stringify(o) });

// Head de la landing comercial (ruta "/"). "/" es COMPARTIDA: sirve la landing de NÚCLEO en los hosts de Raisen
// y la landing white-label del tenant en su propio dominio. Por eso el head va detrás del gate de host — en un
// dominio de tenant devuelve {} y no se emite ni un meta de NÚCLEO.
export function landingHead() {
  if (!isRaisenSeoHost()) return {};
  const { meta, links } = seoHead({
    title: SEO_TITLE, description: SEO_DESCRIPTION, ogTitle: OG_TITLE,
    path: "/", hreflang: true, keywords: SEO_KEYWORDS,
  });
  meta.push({ name: "google-site-verification", content: GOOGLE_SITE_VERIFICATION });
  return { meta, links, scripts: [ld(ORG_LD), ld(APP_LD), ld(FAQ_LD)] };
}

// Head de /demo — misma landing comercial, sin FAQ (la FAQ vive en la home para no duplicar el rich snippet).
export function demoHead() {
  if (!isRaisenSeoHost()) return {};
  const { meta, links } = seoHead({
    title: "Agendar demo — NÚCLEO",
    description: "Agenda una demo gratuita de NÚCLEO. Te mostramos cómo digitalizar y estructurar la operación " +
      "de tu empresa en Puerto Rico y Latinoamérica.",
    path: "/demo", hreflang: true,
  });
  return { meta, links, scripts: [ld(ORG_LD)] };
}

const LEGAL_TITLES: Record<string, string> = {
  privacidad: "Política de Privacidad", terminos: "Términos de Servicio", cookies: "Política de Cookies",
};

// Head de /legal/{slug} — noindex, follow: son páginas de confianza para el usuario, no de ranking.
export function legalHead(slug: string) {
  if (!isRaisenSeoHost()) return {};
  const name = LEGAL_TITLES[slug] ?? "Legal";
  const { meta, links } = seoHead({
    title: `${name} — NÚCLEO`,
    description: `${name} de NÚCLEO by Raisen, plataforma de gestión operacional para empresas.`,
    path: `/legal/${slug}`, noindex: true,
  });
  return { meta, links };
}
