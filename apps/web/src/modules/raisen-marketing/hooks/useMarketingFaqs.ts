import { useEffect, useState } from "react";
import { getFaqConfig, getFaqs } from "@raisen-marketing/infrastructure/marketing-faq.repository";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";
import type { FaqRow, FaqConfig } from "@raisen-marketing/data/faq.types";

// Lee la config + las FAQs activas (ordenadas) al montar. null hasta resolver → la sección usa el fallback.
// `ssr` = snapshot del loader. Sembrarlo es lo que evita que el HTML del servidor muestre el fallback (4
// preguntas) mientras el JSON-LD FAQPage declara las reales: structured data que no corresponde a lo visible.
export function useMarketingFaqs() {
  const ssr = useLandingSsr();
  const [config, setConfig] = useState<FaqConfig | null>(ssr?.faqConfig ?? null);
  const [faqs, setFaqs] = useState<FaqRow[] | null>(ssr?.faqs ?? null);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getFaqConfig().then(setConfig);
    void getFaqs(true).then(setFaqs);
  }, [ssr]);
  return { config, faqs };
}
