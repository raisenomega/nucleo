import { useEffect, useState } from "react";
import { getFaqConfig, getFaqs } from "@raisen-marketing/infrastructure/marketing-faq.repository";
import type { FaqRow, FaqConfig } from "@raisen-marketing/data/faq.types";

// Lee la config + las FAQs activas (ordenadas) al montar. null hasta resolver → la sección usa el fallback.
export function useMarketingFaqs() {
  const [config, setConfig] = useState<FaqConfig | null>(null);
  const [faqs, setFaqs] = useState<FaqRow[] | null>(null);
  useEffect(() => {
    void getFaqConfig().then(setConfig);
    void getFaqs(true).then(setFaqs);
  }, []);
  return { config, faqs };
}
