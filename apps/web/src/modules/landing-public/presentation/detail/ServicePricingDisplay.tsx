import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { formatPrice } from "@landing-public/utils/format-price";
import type { ServiceDetail } from "@landing-public/domain/landing-service-detail.types";

const UNIT: Record<string, TranslationKey> = { hour: "lpServiceUnitHour", day: "lpServiceUnitDay", job: "lpServiceUnitJob", visit: "lpServiceUnitVisit", session: "lpServiceUnitSession" };
const muted = "block text-sm text-[color:hsl(var(--lp-muted))]";

// Pricing rico según pricing_type: label arriba + precio grande + unidad humanizada abajo.
export function ServicePricingDisplay({ service: s }: { service: ServiceDetail }) {
  const { t } = useI18n();
  if (s.pricing_type === "quote_required" || s.price == null)
    return <p style={{ fontSize: "var(--text-h1)" }} className="font-bold">{t("lpServicePricingQuote")}</p>;
  const top = s.pricing_type === "starting_from" ? t("lpServicePricingFrom") : s.pricing_type === "hourly" ? t("lpServicePricingHourly") : "";
  const unit = s.price_unit ? (UNIT[s.price_unit] ? t(UNIT[s.price_unit]!) : s.price_unit) : "";
  return (
    <div>
      {top && <span className={muted}>{top}</span>}
      <span style={{ fontSize: "var(--text-h1)" }} className="font-bold">{formatPrice(s.price, "USD")}</span>
      {unit && <span className={muted}>{unit}</span>}
    </div>
  );
}
