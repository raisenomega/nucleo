import { useState } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { Spinner } from "@shared/components/loading/Spinner";
import { isReady, isLoading } from "@shared/types/fetch-state.types";
import { useOrder } from "@orders/application/useOrder.hook";
import { useOrderHistory } from "@orders/application/useOrderHistory.hook";
import { useOrderActions } from "@orders/application/useOrderActions.hook";
import { usePaymentMethods } from "@orders/application/usePaymentMethods.hook";
import { supabaseOrdersRepository } from "@orders/infrastructure/supabase-orders.repository";
import { supabaseOrderHistoryRepository } from "@orders/infrastructure/supabase-order-history.repository";
import { OrderCustomerInfo } from "@orders/presentation/detail/OrderCustomerInfo";
import { OrderItemsList } from "@orders/presentation/detail/OrderItemsList";
import { OrderTotalsBreakdown } from "@orders/presentation/detail/OrderTotalsBreakdown";
import { OrderTimeline } from "@orders/presentation/detail/OrderTimeline";
import { OrderActions } from "@orders/presentation/detail/OrderActions";
import { ChangeStatusModal } from "@orders/presentation/detail/ChangeStatusModal";
import { ConfirmPaymentModal } from "@orders/presentation/detail/ConfirmPaymentModal";
import { AwaitingConfirmationBanner } from "@orders/presentation/detail/AwaitingConfirmationBanner";
import { ConfirmPaymentReceivedModal } from "@orders/presentation/detail/ConfirmPaymentReceivedModal";
import { ReportNotReceivedModal } from "@orders/presentation/detail/ReportNotReceivedModal";
import type { OrderStatus } from "@orders/domain/order.types";

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const { t } = useI18n(); const { can } = useModuleAccess(); const toast = useToast();
  const { state, reload } = useOrder(supabaseOrdersRepository, orderId);
  const { state: hist, reload: reloadHist } = useOrderHistory(supabaseOrderHistoryRepository, orderId);
  const { busy, changeStatus, confirm, reportNotReceived } = useOrderActions(supabaseOrdersRepository);
  const methods = usePaymentMethods(supabaseOrdersRepository);
  const [modal, setModal] = useState<null | "status" | "pay" | "received" | "reject">(null);
  const errMsg = (e: string) => t(e === "already_confirmed" ? "ordErrAlreadyConfirmed" : e === "forbidden" ? "ordErrForbidden" : "ordErrGeneric");
  const after = async () => { setModal(null); await reload(); await reloadHist(); };
  if (!can("orders", "view")) return <Navigate to="/dashboard" />;
  if (isLoading(state)) return <div className="py-16"><Spinner /></div>;
  if (!isReady(state)) return <div className="p-8 text-center text-sm text-muted-foreground">{t("ordErrGeneric")}</div>;
  const order = state.data;
  const onChange = async (s: OrderStatus, note: string) => { const r = await changeStatus(orderId, s, note); if (r.ok) { toast.success(t("ordChangeSuccess")); await after(); } else toast.error(errMsg(r.error)); };
  const onConfirm = async (pm: string | null, inv: boolean) => { const r = await confirm(orderId, pm, inv); if (r.ok) { toast.success(t("ordConfirmSuccess")); await after(); } else toast.error(errMsg(r.error)); };
  const onReceived = async (note: string) => { const r = await confirm(orderId, null, true, note); if (r.ok) { toast.success(t("ordConfirmSuccess")); await after(); } else toast.error(errMsg(r.error)); };
  const onReport = async (reason: string) => { const r = await reportNotReceived(orderId, reason); if (r.ok) { toast.success(t("ordReportSuccess")); await after(); } else toast.error(errMsg(r.error)); };
  return (
    <div className="space-y-4 p-4 md:p-8">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{t("ordBack")}</Link>
      <h1 className="font-display text-xl font-bold text-foreground md:text-2xl">{order.orderNumber ?? "—"}</h1>
      {order.status === "awaiting_confirmation" && <AwaitingConfirmationBanner clientConfirmedAt={order.clientConfirmedAt} />}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <OrderCustomerInfo order={order} /><OrderItemsList order={order} /><OrderTotalsBreakdown order={order} />
          {isReady(hist) && <OrderTimeline events={hist.data} />}
        </div>
        <OrderActions order={order} onChangeStatus={() => setModal("status")} onConfirm={() => setModal("pay")}
          onConfirmReceived={() => setModal("received")} onReportNotReceived={() => setModal("reject")} />
      </div>
      {modal === "status" && <ChangeStatusModal current={order.status} busy={busy} onConfirm={onChange} onClose={() => setModal(null)} />}
      {modal === "pay" && <ConfirmPaymentModal methods={methods} busy={busy} onConfirm={onConfirm} onClose={() => setModal(null)} />}
      {modal === "received" && <ConfirmPaymentReceivedModal busy={busy} onConfirm={onReceived} onClose={() => setModal(null)} />}
      {modal === "reject" && <ReportNotReceivedModal busy={busy} onSubmit={onReport} onClose={() => setModal(null)} />}
    </div>
  );
}
