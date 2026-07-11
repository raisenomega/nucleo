import ReactMarkdown from "react-markdown";
import { useI18n } from "@shared/i18n";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";
import { ServicePricingDisplay } from "@landing-public/presentation/detail/ServicePricingDisplay";
import { ServiceMetaBadges } from "@landing-public/presentation/detail/ServiceMetaBadges";
import type { ServiceDetail } from "@landing-public/domain/landing-service-detail.types";

export function ServiceInfo({ service: s, onQuote }: { service: ServiceDetail; onQuote: () => void }) {
  const { t } = useI18n();
  return (
    <div>
      {s.short_description && <p className="text-[color:hsl(var(--lp-muted))]">{s.short_description}</p>}
      <div className="mt-4"><ServicePricingDisplay service={s} /></div>
      <ServiceMetaBadges service={s} />
      <FloatingButton onClick={onQuote} variant="primary" size="lg" className="mt-6">{t("lpDetailCtaQuoteService")}</FloatingButton>
      {s.long_description && <div className="prose prose-sm mt-8 max-w-none text-[color:hsl(var(--lp-fg))]"><ReactMarkdown>{s.long_description}</ReactMarkdown></div>}
    </div>
  );
}
