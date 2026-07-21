// Sufijo de período de cobro, compartido por PricingTierCard y PricingAddonCard.
const MONTH = { es: "/mes", en: "/mo" };
const PERIOD: Record<string, { es: string; en: string }> = {
  month: MONTH, year: { es: "/año", en: "/yr" }, one_time: { es: "", en: "" },
};
export const periodLabel = (p: string, lang: "es" | "en"): string => (PERIOD[p] ?? MONTH)[lang];

// Etiqueta explícita para pagos únicos. `periodLabel` devuelve "" en one_time (el tier no la necesita), pero
// en los add-ons hay que distinguir "$6,500 pago único" de "+$99/mes" o el precio se lee como recurrente.
export const isOneTime = (p: string): boolean => p === "one_time";
export const oneTimeLabel = (lang: "es" | "en"): string => (lang === "es" ? "pago único" : "one-time");
