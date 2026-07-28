import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { SalesOrder } from "@sales/domain/sales-order.types";

export function SalesOrderKpis({ rows }: { rows: readonly SalesOrder[] }) {
  const { t } = useI18n();
  const open = rows.filter((o) => !["invoiced", "closed", "cancelled"].includes(o.status)).length;
  const toShip = rows.filter((o) => ["confirmed", "partially_shipped"].includes(o.status)).length;
  const value = rows.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const card = (label: string, val: string, tone: string) => (
    <div className="rounded-xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-bold ${tone}`}>{val}</p></div>);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {card(t("soOpen"), String(open), "text-blue-600")}
      {card(t("soToShip"), String(toShip), "text-amber-600")}
      {card(t("salesOrders"), String(rows.length), "text-foreground")}
      {card(t("soValue"), formatCurrency(value), "text-foreground")}
    </div>
  );
}
