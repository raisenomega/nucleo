import { useEffect, useState } from "react";
import { getLeadFormConfig } from "@raisen-marketing/infrastructure/marketing-lead-form.repository";
import type { LeadFormConfig } from "@raisen-marketing/data/lead-form.types";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";

// Lee la config editable del form comercial al montar. null hasta resolver → la sección usa el fallback.
// `ssr` = snapshot del loader (SSR). Si viene sembrado, NO se refetchea: el primer render de cliente
// usa exactamente lo mismo que el servidor, así no hay hydration mismatch.
export function useMarketingLeadForm() {
  const ssr = useLandingSsr();
  const [config, setConfig] = useState<LeadFormConfig | null>(ssr?.leadFormConfig ?? null);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getLeadFormConfig().then(setConfig);
  }, [ssr]);
  return config;
}
