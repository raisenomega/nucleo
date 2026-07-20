import { useEffect, useState } from "react";
import { getAddons } from "@raisen-marketing/infrastructure/marketing-addons.repository";
import type { PricingAddonRow } from "@raisen-marketing/data/pricing.types";

// Add-ons activos (ordenados) para la sección de precios de la landing. [] hasta resolver.
export function useMarketingAddons() {
  const [addons, setAddons] = useState<PricingAddonRow[]>([]);
  useEffect(() => { void getAddons(true).then(setAddons); }, []);
  return addons;
}
