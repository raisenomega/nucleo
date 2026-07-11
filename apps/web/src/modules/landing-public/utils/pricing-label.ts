import type { TranslationKey } from "@shared/i18n";
import { formatPrice } from "@landing-public/utils/format-price";
import type { HomeService } from "@landing-public/domain/landing-home.types";

type T = (key: TranslationKey, params?: Record<string, string | number>) => string;

// Label de precio de un servicio según pricing_type.
export function pricingLabel(s: HomeService, t: T): string {
  if (s.pricing_type === "quote_required" || s.price == null) return t("lpRequestQuote");
  const price = formatPrice(s.price, "USD");
  if (s.pricing_type === "starting_from") return t("lpFromPrice", { price });
  if (s.pricing_type === "hourly") return t("lpPerHour", { price });
  return price;
}
