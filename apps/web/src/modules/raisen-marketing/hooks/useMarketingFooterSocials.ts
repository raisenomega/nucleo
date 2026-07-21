import { useEffect, useState } from "react";
import { getSocialLinks } from "@raisen-marketing/infrastructure/marketing-social.repository";
import type { SocialLink } from "@raisen-marketing/data/footer.types";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";

// Links sociales activos (ordenados) del footer. [] hasta resolver → el footer no muestra la fila social.
// `ssr` = snapshot del loader (SSR). Si viene sembrado, NO se refetchea: el primer render de cliente
// usa exactamente lo mismo que el servidor, así no hay hydration mismatch.
export function useMarketingFooterSocials() {
  const ssr = useLandingSsr();
  const [socials, setSocials] = useState<SocialLink[]>(ssr?.socials ?? []);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getSocialLinks(true).then(setSocials);
  }, [ssr]);
  return socials;
}
