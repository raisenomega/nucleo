import { useI18n } from "@shared/i18n";
import { leadSourceLabel } from "@shared/constants/lead-sources";

// Badge legible del origen del lead. fallback = label de categoría (leadSourceLabel) para sources sin mapping.
export function LeadSourceBadge({ source, fallback }: { source: string; fallback?: string }) {
  const { locale } = useI18n();
  return <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-bold text-foreground">{leadSourceLabel(source, locale === "en", fallback)}</span>;
}
