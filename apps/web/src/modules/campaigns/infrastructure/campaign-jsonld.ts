import type { CampaignPageData } from "@campaigns/domain/campaign.types";

// R6+ · datos estructurados JSON-LD para SEO/AEO/GEO. FAQPage (del bloque faq → rich results de Google + lo que
// citan ChatGPT/Perplexity/Gemini) + Service (nombre/descr/proveedor). White-label: usa el contenido de la
// página + la marca del tenant, nunca NÚCLEO. Se emite en el <head> del SSR de /c/{slug}.
type Obj = Record<string, unknown>;
const arr = (v: unknown): Obj[] => (Array.isArray(v) ? (v as Obj[]) : []);

export function campaignJsonLd(data: CampaignPageData, host: string): Obj[] {
  const p = data.page; const out: Obj[] = [];
  const faq = data.blocks.find((b) => b.blockType === "faq");
  const c = faq ? (p.lang === "en" && faq.contentEn ? faq.contentEn : faq.contentEs) : null;
  const qa = arr(c?.items).filter((q) => q.question && q.answer).map((q) => ({
    "@type": "Question", name: q.question, acceptedAnswer: { "@type": "Answer", text: q.answer },
  }));
  if (qa.length) out.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qa });
  out.push({
    "@context": "https://schema.org", "@type": "Service",
    name: p.seoTitle ?? p.name, description: p.seoDescription ?? "", url: `https://${host}/c/${p.slug}`,
    ...(data.brand?.displayName ? { provider: { "@type": "LocalBusiness", name: data.brand.displayName } } : {}),
  });
  return out;
}
