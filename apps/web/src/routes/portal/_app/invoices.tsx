import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { usePortal } from "@shared/portal/portal-context";
import { useCustomerCommerce } from "@shared/portal/useCustomerCommerce.hook";
import { InvoiceCard } from "@shared/portal/InvoiceCard";
import { formatCurrency } from "@shared/lib/format";

export const Route = createFileRoute("/portal/_app/invoices")({ component: PortalInvoices });

function PortalInvoices() {
  const { t } = useI18n();
  const { customer } = usePortal();
  const c = useCustomerCommerce(customer.tenantId);
  const owed = c.invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("navInvoices")}</h1>
      {owed > 0 && <p className="text-sm font-bold text-destructive">{t("pTotalOwed")}: {formatCurrency(owed)}</p>}
      {c.invoices.length === 0 && <p className="text-sm text-muted-foreground">{t("pNoInvoices")}</p>}
      {c.invoices.map((inv) => <InvoiceCard key={inv.id} invoice={inv} />)}
    </div>
  );
}
