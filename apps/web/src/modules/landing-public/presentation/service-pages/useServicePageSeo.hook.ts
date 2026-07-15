import { useEffect } from "react";
import type { ServicePage } from "@landing-public/domain/service-page.types";

function setMeta(key: string, content: string, attr = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
}

// SEO client-side + JSON-LD (Service + FAQPage) inyectado en <head>. SSR real = follow-up (patrón useDetailSeo).
export function useServicePageSeo(page: ServicePage | null, en: boolean) {
  useEffect(() => {
    if (typeof document === "undefined" || !page) return;
    const { seo, hero, faq } = page;
    document.title = en ? seo.meta_title_en : seo.meta_title_es;
    setMeta("description", en ? seo.meta_description_en : seo.meta_description_es);
    setMeta("keywords", en ? seo.keywords_en : seo.keywords_es);
    setMeta("og:title", en ? hero.title_en : hero.title_es, "property");
    setMeta("og:description", en ? seo.meta_description_en : seo.meta_description_es, "property");
    const img = seo.og_image ?? hero.image_url;
    if (img) setMeta("og:image", img, "property");
    const svc = { "@context": "https://schema.org", "@type": "Service", name: en ? hero.title_en : hero.title_es, description: en ? seo.meta_description_en : seo.meta_description_es };
    const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: en ? f.question_en : f.question_es, acceptedAnswer: { "@type": "Answer", text: en ? f.answer_en : f.answer_es } })) };
    let s = document.getElementById("sp-jsonld");
    if (!s) { s = document.createElement("script"); s.id = "sp-jsonld"; (s as HTMLScriptElement).type = "application/ld+json"; document.head.appendChild(s); }
    s.textContent = JSON.stringify([svc, faqLd]);
    return () => { document.getElementById("sp-jsonld")?.remove(); };
  }, [page, en]);
}
