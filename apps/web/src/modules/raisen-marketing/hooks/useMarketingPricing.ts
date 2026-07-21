import { useEffect, useState } from "react";
import { getPricingConfig, getPricingTiers } from "@raisen-marketing/infrastructure/marketing-pricing.repository";
import type { PricingTierRow, PricingConfig } from "@raisen-marketing/data/pricing.types";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";

// Lee la config + los tiers activos (ordenados) al montar. null hasta resolver → la sección usa el fallback.
// `ssr` = snapshot del loader (SSR). Si viene sembrado, NO se refetchea: el primer render de cliente
// usa exactamente lo mismo que el servidor, así no hay hydration mismatch.
export function useMarketingPricing() {
  const ssr = useLandingSsr();
  const [config, setConfig] = useState<PricingConfig | null>(ssr?.pricingConfig ?? null);
  const [tiers, setTiers] = useState<PricingTierRow[] | null>(ssr?.tiers ?? null);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getPricingConfig().then(setConfig);
    void getPricingTiers(true).then(setTiers);
  }, [ssr]);
  return { config, tiers };
}
