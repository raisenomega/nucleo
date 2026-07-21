import { useEffect, useState } from "react";
import { getSections } from "@raisen-marketing/infrastructure/marketing-sections.repository";
import type { SectionRow } from "@raisen-marketing/data/section.types";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";

// Lee las secciones (ordenadas) al montar. null hasta resolver → la landing usa el fallback (orden real).
// `ssr` = snapshot del loader (SSR). Si viene sembrado, NO se refetchea: el primer render de cliente
// usa exactamente lo mismo que el servidor, así no hay hydration mismatch.
export function useMarketingSections() {
  const ssr = useLandingSsr();
  const [sections, setSections] = useState<SectionRow[] | null>(ssr?.sections ?? null);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getSections().then(setSections);
  }, [ssr]);
  return sections;
}
