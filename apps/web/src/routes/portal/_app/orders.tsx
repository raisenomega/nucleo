import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { usePortal } from "@shared/portal/portal-context";
import { useCustomerCommerce } from "@shared/portal/useCustomerCommerce.hook";
import { OrderCard } from "@shared/portal/OrderCard";
import { OrderDetail } from "@shared/portal/OrderDetail";

export const Route = createFileRoute("/portal/_app/orders")({ component: PortalOrders });

function PortalOrders() {
  const { t } = useI18n();
  const { customer } = usePortal();
  const c = useCustomerCommerce(customer.tenantId);
  const [open, setOpen] = useState<string | null>(null);
  const sel = c.orders.find((o) => o.id === open);
  const confirm = (id: string) => { if (window.confirm(t("pConfirmPaidQ"))) void c.confirm(id).then(() => setOpen(null)); };
  const cancel = (id: string) => { if (window.confirm(t("pCancelQ"))) void c.cancel(id).then(() => setOpen(null)); };
  const reorder = (id: string) => void c.reorder(id).then((ok) => { setOpen(null); if (ok) window.alert(t("pReorderCreated")); });
  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("navOrders")}</h1>
      {c.orders.length === 0 && <p className="text-sm text-muted-foreground">{t("pNoOrders")}</p>}
      {c.orders.map((o) => <OrderCard key={o.id} order={o} onOpen={setOpen} />)}
      {sel && <OrderDetail order={sel} onClose={() => setOpen(null)} onConfirm={confirm} onCancel={cancel} onReorder={reorder} />}
    </div>
  );
}
