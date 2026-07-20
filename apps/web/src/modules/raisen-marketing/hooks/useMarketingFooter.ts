import { useEffect, useState } from "react";
import { getFooter } from "@raisen-marketing/infrastructure/marketing-footer.repository";
import type { FooterRow } from "@raisen-marketing/data/footer.types";

// Lee la fila única del footer al montar. null hasta resolver → la sección usa el fallback.
export function useMarketingFooter() {
  const [footer, setFooter] = useState<FooterRow | null>(null);
  useEffect(() => { void getFooter().then(setFooter); }, []);
  return footer;
}
