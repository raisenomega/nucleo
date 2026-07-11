import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { BillingSummary } from "@billing/domain/invoice.types";

export function BillingKpis({ s }: { s: BillingSummary }) {
  const { t } = useI18n();
  const card = (label: string, val: string, tone: string) => (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-bold ${tone}`}>{val}</p></div>);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {card(t("kpiPending"), String(s.invoices_pending), "text-foreground")}
      {card(t("kpiOverdue"), String(s.invoices_overdue), "text-red-600")}
      {card(t("orders"), String(s.orders_pending), "text-amber-600")}
      {card(t("kpiMrr"), formatCurrency(s.mrr), "text-green-600")}
    </div>
  );
}
