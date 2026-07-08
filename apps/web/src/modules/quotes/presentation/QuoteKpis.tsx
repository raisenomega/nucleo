import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { QuotesSummary } from "@quotes/domain/quote.types";

export function QuoteKpis({ s }: { s: QuotesSummary }) {
  const { t } = useI18n();
  const card = (label: string, val: string, tone: string) => (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-bold ${tone}`}>{val}</p></div>);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {card(t("qsSent"), String(s.sent), "text-blue-600")}
      {card(t("qsAccepted"), String(s.accepted), "text-green-600")}
      {card(t("qsRejected"), String(s.rejected), "text-red-600")}
      {card(t("totalQuoted"), formatCurrency(s.total_quoted), "text-primary")}
    </div>
  );
}
