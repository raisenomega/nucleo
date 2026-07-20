import { useEffect, useState } from "react";
import { getPricingConfig, getPricingTiers } from "@raisen-marketing/infrastructure/marketing-pricing.repository";
import type { PricingTierRow, PricingConfig } from "@raisen-marketing/data/pricing.types";

// Lee la config + los tiers activos (ordenados) al montar. null hasta resolver → la sección usa el fallback.
export function useMarketingPricing() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [tiers, setTiers] = useState<PricingTierRow[] | null>(null);
  useEffect(() => {
    void getPricingConfig().then(setConfig);
    void getPricingTiers(true).then(setTiers);
  }, []);
  return { config, tiers };
}
