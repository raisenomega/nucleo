import { useEffect, useState } from "react";
import { getFeaturesConfig, getFeatures } from "@raisen-marketing/infrastructure/marketing-features.repository";
import type { MarketingFeatureRow, FeaturesConfig } from "@raisen-marketing/data/feature.types";

// Lee la config + las features activas (ordenadas) al montar. null hasta resolver → la sección usa el fallback.
export function useMarketingFeatures() {
  const [config, setConfig] = useState<FeaturesConfig | null>(null);
  const [features, setFeatures] = useState<MarketingFeatureRow[] | null>(null);
  useEffect(() => {
    void getFeaturesConfig().then(setConfig);
    void getFeatures(true).then(setFeatures);
  }, []);
  return { config, features };
}
