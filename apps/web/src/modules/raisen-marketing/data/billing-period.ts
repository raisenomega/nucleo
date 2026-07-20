// Sufijo de período de cobro, compartido por PricingTierCard y PricingAddonCard.
const MONTH = { es: "/mes", en: "/mo" };
const PERIOD: Record<string, { es: string; en: string }> = {
  month: MONTH, year: { es: "/año", en: "/yr" }, one_time: { es: "", en: "" },
};
export const periodLabel = (p: string, lang: "es" | "en"): string => (PERIOD[p] ?? MONTH)[lang];
