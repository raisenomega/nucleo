import { useEffect, useState } from "react";
import { getFooter } from "@raisen-marketing/infrastructure/marketing-footer.repository";
import type { FooterRow } from "@raisen-marketing/data/footer.types";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";

// Lee la fila única del footer al montar. null hasta resolver → la sección usa el fallback.
// `ssr` = snapshot del loader (SSR). Si viene sembrado, NO se refetchea: el primer render de cliente
// usa exactamente lo mismo que el servidor, así no hay hydration mismatch.
export function useMarketingFooter() {
  const ssr = useLandingSsr();
  const [footer, setFooter] = useState<FooterRow | null>(ssr?.footer ?? null);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getFooter().then(setFooter);
  }, [ssr]);
  return footer;
}
