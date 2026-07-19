import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { usePortal } from "@shared/portal/portal-context";
import { useCustomerCommerce } from "@shared/portal/useCustomerCommerce.hook";
import { formatCurrency } from "@shared/lib/format";

export const Route = createFileRoute("/portal/_app/payments")({ component: PortalPayments });

// Historial de pagos derivado de las órdenes pagadas (métodos guardados del cliente: diferido a Stripe/P5).
function PortalPayments() {
  const { t } = useI18n();
  const { customer } = usePortal();
  const c = useCustomerCommerce(customer.tenantId);
  const paid = c.orders.filter((o) => o.paidAt);
  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("navPayments")}</h1>
      <p className="text-sm font-bold uppercase text-muted-foreground">{t("pPaymentHistory")}</p>
      {paid.length === 0 && <p className="text-sm text-muted-foreground">{t("pNoPayments")}</p>}
      {paid.map((o) => (
        <div key={o.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
          <span>{o.paidAt?.slice(0, 10)} · {o.orderNumber || "—"}{o.paymentMethodKey && ` · ${o.paymentMethodKey}`}</span>
          <span className="font-semibold text-foreground">{formatCurrency(o.total)}</span>
        </div>
      ))}
    </div>
  );
}
