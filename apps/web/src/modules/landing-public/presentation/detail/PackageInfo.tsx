import ReactMarkdown from "react-markdown";
import { useI18n } from "@shared/i18n";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";
import { formatPrice } from "@landing-public/utils/format-price";
import type { PackageDetail } from "@landing-public/domain/landing-package-detail.types";

export function PackageInfo({ pkg: p, onQuote }: { pkg: PackageDetail; onQuote: () => void }) {
  const { t } = useI18n();
  return (
    <div>
      {p.short_description && <p className="text-[color:hsl(var(--lp-muted))]">{p.short_description}</p>}
      <div className="mt-4 flex items-baseline gap-3">
        {p.price != null && <span style={{ fontSize: "var(--text-h2)" }} className="font-bold">{formatPrice(p.price, p.currency)}</span>}
        {p.compare_at_price != null && <span className="text-[color:hsl(var(--lp-muted))] line-through">{formatPrice(p.compare_at_price, p.currency)}</span>}
      </div>
      <FloatingButton onClick={onQuote} variant="primary" size="lg" className="mt-6">{t("lpDetailCtaQuotePackage")}</FloatingButton>
      {p.long_description && <div className="prose prose-sm mt-8 max-w-none text-[color:hsl(var(--lp-fg))]"><ReactMarkdown>{p.long_description}</ReactMarkdown></div>}
    </div>
  );
}
