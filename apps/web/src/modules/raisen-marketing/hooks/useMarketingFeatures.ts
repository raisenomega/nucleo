import { useEffect, useState } from "react";
import { getFeaturesConfig, getFeatures } from "@raisen-marketing/infrastructure/marketing-features.repository";
import type { MarketingFeatureRow, FeaturesConfig } from "@raisen-marketing/data/feature.types";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";

// Lee la config + las features activas (ordenadas) al montar. null hasta resolver → la sección usa el fallback.
// `ssr` = snapshot del loader (SSR). Si viene sembrado, NO se refetchea: el primer render de cliente
// usa exactamente lo mismo que el servidor, así no hay hydration mismatch.
export function useMarketingFeatures() {
  const ssr = useLandingSsr();
  const [config, setConfig] = useState<FeaturesConfig | null>(ssr?.featuresConfig ?? null);
  const [features, setFeatures] = useState<MarketingFeatureRow[] | null>(ssr?.features ?? null);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getFeaturesConfig().then(setConfig);
    void getFeatures(true).then(setFeatures);
  }, [ssr]);
  return { config, features };
}
