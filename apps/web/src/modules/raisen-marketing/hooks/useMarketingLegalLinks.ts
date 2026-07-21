import { useEffect, useState } from "react";
import { getLegalLinks } from "@raisen-marketing/infrastructure/marketing-legal.repository";
import type { LegalLink } from "@raisen-marketing/data/legal.types";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";

// Links legales activos (para el footer). null hasta resolver → el footer usa el fallback (seed).
// `ssr` = snapshot del loader (SSR). Si viene sembrado, NO se refetchea: el primer render de cliente
// usa exactamente lo mismo que el servidor, así no hay hydration mismatch.
export function useMarketingLegalLinks() {
  const ssr = useLandingSsr();
  const [links, setLinks] = useState<LegalLink[] | null>(ssr?.legalLinks ?? null);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getLegalLinks().then(setLinks);
  }, [ssr]);
  return links;
}
