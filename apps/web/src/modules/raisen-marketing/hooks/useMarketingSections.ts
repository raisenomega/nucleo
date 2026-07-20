import { useEffect, useState } from "react";
import { getSections } from "@raisen-marketing/infrastructure/marketing-sections.repository";
import type { SectionRow } from "@raisen-marketing/data/section.types";

// Lee las secciones (ordenadas) al montar. null hasta resolver → la landing usa el fallback (orden real).
export function useMarketingSections() {
  const [sections, setSections] = useState<SectionRow[] | null>(null);
  useEffect(() => { void getSections().then(setSections); }, []);
  return sections;
}
