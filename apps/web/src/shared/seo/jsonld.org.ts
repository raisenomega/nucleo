import { SITE_URL, SITE_NAME, LEGAL_NAME, SALES_EMAIL, MODULES, PRICE_PRO, PRICE_ENTERPRISE, SEO_DESCRIPTION } from "@shared/seo/site.constants";

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

// JSON-LD SoftwareApplication — precios REALES y vigentes (Starter descontinuado, no se expone).
// AggregateOffer va de $749/mes (Pro) a $14,995 pago único (Enterprise): 2 ofertas.
export const APP_LD = {
  "@context": "https://schema.org", "@type": "SoftwareApplication",
  name: "NÚCLEO", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: SITE_URL,
  description: SEO_DESCRIPTION,
  offers: {
    "@type": "AggregateOffer", lowPrice: PRICE_PRO, highPrice: PRICE_ENTERPRISE,
    priceCurrency: "USD", offerCount: "2",
  },
  creator: { "@type": "Organization", name: "Raisen Agency" },
  featureList: MODULES.map(([n]) => n).join(", "),
  inLanguage: ["es", "en"],
};
