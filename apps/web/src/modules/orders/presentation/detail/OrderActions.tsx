import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { OrderStatusBadge } from "@orders/presentation/list/OrderStatusBadge";
import type { Order } from "@orders/domain/order.types";

const TERMINAL = ["paid", "refunded", "canceled"];

export function OrderActions({ order, onChangeStatus, onConfirm }: {
  order: Order; onChangeStatus: () => void; onConfirm: () => void;
}) {
  const { t } = useI18n();
  const linked = (label: string, to: "/billing" | "/leads", id: string | null) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {id ? <Link to={to} className="text-foreground underline">{t("ordActionView")}</Link> : <span className="text-muted-foreground">—</span>}
    </div>
  );
  return (
    <aside className="h-fit space-y-3 rounded-lg border border-border p-4 md:sticky md:top-4">
      <div><OrderStatusBadge status={order.status} large /></div>
      {!TERMINAL.includes(order.status) && (
        <button type="button" onClick={onConfirm} className="w-full rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground">{t("ordActionConfirm")}</button>
      )}
      <button type="button" onClick={onChangeStatus} className="w-full rounded-lg border border-border px-4 py-2 text-foreground">{t("ordActionChangeStatus")}</button>
      <div className="space-y-1.5 border-t border-border pt-3">
        {linked(t("ordLinkedInvoice"), "/billing", order.linkedInvoiceId)}
        {linked(t("ordLinkedLead"), "/leads", order.linkedLeadId)}
      </div>
    </aside>
  );
}
