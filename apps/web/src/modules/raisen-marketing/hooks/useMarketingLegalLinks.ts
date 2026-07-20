import { useEffect, useState } from "react";
import { getLegalLinks } from "@raisen-marketing/infrastructure/marketing-legal.repository";
import type { LegalLink } from "@raisen-marketing/data/legal.types";

// Links legales activos (para el footer). null hasta resolver → el footer usa el fallback (seed).
export function useMarketingLegalLinks() {
  const [links, setLinks] = useState<LegalLink[] | null>(null);
  useEffect(() => { void getLegalLinks().then(setLinks); }, []);
  return links;
}
