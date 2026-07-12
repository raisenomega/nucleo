import { useI18n } from "@shared/i18n";
import { OrderTimelineEvent } from "@orders/presentation/detail/OrderTimelineEvent";
import type { OrderHistoryEvent } from "@orders/domain/order-status-history.types";

export function OrderTimeline({ events }: { events: OrderHistoryEvent[] }) {
  const { t } = useI18n();
  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="mb-3 font-semibold text-foreground">{t("ordTimelineTitle")}</h2>
      {events.length ? <ol>{events.map((e) => <OrderTimelineEvent key={e.id} event={e} />)}</ol>
        : <p className="text-sm text-muted-foreground">—</p>}
    </section>
  );
}
