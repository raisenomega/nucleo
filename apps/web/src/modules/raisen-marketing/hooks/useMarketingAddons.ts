import { useEffect, useState } from "react";
import { getAddons } from "@raisen-marketing/infrastructure/marketing-addons.repository";
import type { PricingAddonRow } from "@raisen-marketing/data/pricing.types";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";

// Add-ons activos (ordenados) para la sección de precios de la landing. [] hasta resolver.
// `ssr` = snapshot del loader (SSR). Si viene sembrado, NO se refetchea: el primer render de cliente
// usa exactamente lo mismo que el servidor, así no hay hydration mismatch.
export function useMarketingAddons() {
  const ssr = useLandingSsr();
  const [addons, setAddons] = useState<PricingAddonRow[]>(ssr?.addons ?? []);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getAddons(true).then(setAddons);
  }, [ssr]);
  return addons;
}
