import { useI18n } from "@shared/i18n";
import { STATUS_LABEL, STATUS_TONE } from "@orders/presentation/order-status.const";
import type { OrderStatus } from "@orders/domain/order.types";

export function OrderStatusBadge({ status, large }: { status: OrderStatus; large?: boolean }) {
  const { t } = useI18n();
  return (
    <span className={`inline-block rounded-full font-medium ${STATUS_TONE[status]} ${large ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"}`}>
      {t(STATUS_LABEL[status])}
    </span>
  );
}
