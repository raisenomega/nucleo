import { useEffect, useState } from "react";
import { getSocialLinks } from "@raisen-marketing/infrastructure/marketing-social.repository";
import type { SocialLink } from "@raisen-marketing/data/footer.types";

// Links sociales activos (ordenados) del footer. [] hasta resolver → el footer no muestra la fila social.
export function useMarketingFooterSocials() {
  const [socials, setSocials] = useState<SocialLink[]>([]);
  useEffect(() => { void getSocialLinks(true).then(setSocials); }, []);
  return socials;
}
