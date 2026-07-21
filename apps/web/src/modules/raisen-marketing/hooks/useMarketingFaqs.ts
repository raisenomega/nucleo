import { useEffect, useState } from "react";
import { getFaqConfig, getFaqs } from "@raisen-marketing/infrastructure/marketing-faq.repository";
import type { FaqRow, FaqConfig } from "@raisen-marketing/data/faq.types";

// Lee la config + las FAQs activas (ordenadas) al montar. null hasta resolver → la sección usa el fallback.
// `initial` viene del loader de la ruta en SSR: siembra el estado para que el HTML del servidor traiga las
// preguntas REALES. Es lo que evita que el FAQPage declare 8 preguntas y el HTML muestre solo las del
// fallback. Como el loaderData es idéntico en servidor y en el primer render de cliente, no hay mismatch.
export function useMarketingFaqs(initial?: FaqRow[] | null) {
  const [config, setConfig] = useState<FaqConfig | null>(null);
  const [faqs, setFaqs] = useState<FaqRow[] | null>(initial ?? null);
  useEffect(() => {
    void getFaqConfig().then(setConfig);
    void getFaqs(true).then(setFaqs);
  }, []);
  return { config, faqs };
}
