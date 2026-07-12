import { useI18n } from "@shared/i18n";
import { OrderRow } from "@orders/presentation/list/OrderRow";
import type { Order } from "@orders/domain/order.types";

export function OrdersTable({ orders, onOpen }: { orders: Order[]; onOpen: (id: string) => void }) {
  const { t } = useI18n();
  const th = "p-3 font-medium";
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
      <table className="w-full">
        <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className={th}>{t("ordColOrder")}</th><th className={th}>{t("ordColCustomer")}</th>
            <th className={th}>{t("total")}</th><th className={th}>{t("status")}</th>
            <th className={th}>{t("ordColItems")}</th><th className={th}>{t("ordColDate")}</th>
          </tr>
        </thead>
        <tbody>{orders.map((o) => <OrderRow key={o.id} order={o} onOpen={onOpen} />)}</tbody>
      </table>
    </div>
  );
}
