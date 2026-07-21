import { PRICE_STARTER, PRICE_PRO, PRICE_ENTERPRISE, PRICE_SETUP } from "@shared/seo/site.constants";
import type { SeoFaq } from "@shared/seo/seo-data";

const qa = (q: string, a: string) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } });

// Fallback: solo se emite si la DB no responde. Es un subconjunto del seed de la migr 215.
const FALLBACK: SeoFaq[] = [
  { id: "f1", qEs: "¿Qué es NÚCLEO?", qEn: "What is NÚCLEO?",
    aEs: "NÚCLEO es una plataforma de gestión operacional para PYMEs y empresas grandes. Integra facturación, operaciones, nómina, fiscal, landing white-label y agentes IA en un solo sistema bajo la marca del cliente.",
    aEn: "NÚCLEO is an operational management platform for SMBs and large companies." },
  { id: "f2", qEs: "¿Cuánto cuesta NÚCLEO?", qEn: "How much does NÚCLEO cost?",
    aEs: `NÚCLEO tiene 3 planes: Starter desde $${PRICE_STARTER}/mes, Pro desde $${PRICE_PRO}/mes y Enterprise desde $${PRICE_ENTERPRISE}/mes. Todos incluyen usuarios ilimitados y un setup de implementación de $${PRICE_SETUP}.`,
    aEn: `NÚCLEO has 3 plans: Starter from $${PRICE_STARTER}/mo, Pro from $${PRICE_PRO}/mo and Enterprise from $${PRICE_ENTERPRISE}/mo.` },
  { id: "f3", qEs: "¿Puedo usar NÚCLEO con mi propia marca?", qEn: "Can I use NÚCLEO with my own brand?",
    aEs: "Sí. NÚCLEO es 100% white-label. Tu cliente ve tu marca, tu dominio, tu logo — nunca la marca de NÚCLEO.",
    aEn: "Yes. NÚCLEO is 100% white-label." },
];

// JSON-LD FAQPage construido desde `marketing_faqs` — LA MISMA tabla que renderiza el acordeón visible.
// Es un requisito de Google, no una preferencia: el structured data debe corresponder a contenido visible.
// Si la sección FAQ está oculta en /web/secciones, este bloque NO debe emitirse (lo decide marketing.head).
export function faqLd(faqs?: SeoFaq[]) {
  const items = faqs && faqs.length ? faqs : FALLBACK;
  return {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: items.map((f) => qa(f.qEs, f.aEs)),
  };
}
