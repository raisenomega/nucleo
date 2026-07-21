import { SITE_URL, SITE_NAME, LEGAL_NAME, SALES_EMAIL, MODULES, PRICE_STARTER, PRICE_ENTERPRISE, SEO_DESCRIPTION } from "@shared/seo/site.constants";
import type { SeoTier } from "@shared/seo/seo-data";

// JSON-LD Organization — identifica la entidad ante Google (Knowledge Panel) y ante los motores de respuesta.
export const ORG_LD = {
  "@context": "https://schema.org", "@type": "Organization",
  name: SITE_NAME, legalName: LEGAL_NAME, url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512.png`,
  description: "Plataforma de gestión operacional SaaS para PYMEs y empresas grandes en Puerto Rico y Latinoamérica",
  foundingDate: "2024",
  address: { "@type": "PostalAddress", addressLocality: "San Juan", addressRegion: "PR", addressCountry: "US" },
  contactPoint: { "@type": "ContactPoint", email: SALES_EMAIL, contactType: "sales", areaServed: ["PR", "US", "LATAM"], availableLanguage: ["es", "en"] },
  sameAs: ["https://instagram.com/nucleoraisen", "https://linkedin.com/company/raisen"],
};

// JSON-LD SoftwareApplication. Los precios salen de los tiers ACTIVOS de la DB: así el AggregateOffer nunca
// contradice lo que el visitante ve en la sección Precios. `tiers` vacío/ausente → fallback a site.constants.
export function appLd(tiers?: SeoTier[]) {
  const prices = (tiers ?? []).map((t) => t.price).filter((p) => Number.isFinite(p) && p > 0);
  const offers = prices.length
    ? { low: String(Math.min(...prices)), high: String(Math.max(...prices)), count: String(prices.length) }
    : { low: PRICE_STARTER, high: PRICE_ENTERPRISE, count: "3" };
  return {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: "NÚCLEO", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: SITE_URL,
    description: SEO_DESCRIPTION,
    offers: { "@type": "AggregateOffer", lowPrice: offers.low, highPrice: offers.high, priceCurrency: "USD", offerCount: offers.count },
    creator: { "@type": "Organization", name: "Raisen Agency" },
    featureList: MODULES.map(([n]) => n).join(", "),
    inLanguage: ["es", "en"],
  };
}
