import { useI18n } from "@shared/i18n";
import { STATUS_DOT, STATUS_LABEL } from "@orders/presentation/order-status.const";
import type { OrderHistoryEvent } from "@orders/domain/order-status-history.types";

export function OrderTimelineEvent({ event }: { event: OrderHistoryEvent }) {
  const { t } = useI18n();
  const label = event.fromStatus === null
    ? t("ordTimelineCreated")
    : t("ordTimelineChanged", { status: t(STATUS_LABEL[event.toStatus]) });
  return (
    <li className="flex gap-3 pb-4">
      <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${STATUS_DOT[event.toStatus]}`} />
      <div className="flex-1">
        <div className="text-sm text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">
          {new Date(event.createdAt).toLocaleString()}{event.changedByName ? ` · ${event.changedByName}` : ""}
        </div>
        {event.note && <p className="mt-1 border-l-2 border-border pl-2 text-xs italic text-muted-foreground">{event.note}</p>}
      </div>
    </li>
  );
}
