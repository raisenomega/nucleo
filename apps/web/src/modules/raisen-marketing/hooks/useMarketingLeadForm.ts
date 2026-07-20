import { useEffect, useState } from "react";
import { getLeadFormConfig } from "@raisen-marketing/infrastructure/marketing-lead-form.repository";
import type { LeadFormConfig } from "@raisen-marketing/data/lead-form.types";

// Lee la config editable del form comercial al montar. null hasta resolver → la sección usa el fallback.
export function useMarketingLeadForm() {
  const [config, setConfig] = useState<LeadFormConfig | null>(null);
  useEffect(() => { void getLeadFormConfig().then(setConfig); }, []);
  return config;
}
