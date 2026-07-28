import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import { Pagination } from "@shared/components/Pagination";
import { SO_ST_KEY, SO_ST_COLOR } from "@sales/presentation/sales-order-ui";
import type { SalesOrder } from "@sales/domain/sales-order.types";

const frac = (o: SalesOrder, k: "qtyShipped" | "qtyInvoiced") => {
  const ord = o.items.reduce((s, i) => s + i.qtyOrdered, 0); const d = o.items.reduce((s, i) => s + i[k], 0);
  return ord ? `${d}/${ord}` : "—";
};

export function SalesOrderTable({ rows, onView }: { rows: readonly SalesOrder[]; onView: (o: SalesOrder) => void }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noSalesOrders")}</p>;
  const visible = rows.slice((page - 1) * 12, page * 12);
  const st = (o: SalesOrder) => <span className={`rounded px-2 py-0.5 text-xs font-bold ${SO_ST_COLOR[o.status]}`}>{t(SO_ST_KEY[o.status])}</span>;
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("orderNumber")}</th><th className="p-2">{t("clientName")}</th><th className="p-2">{t("deliveryDate")}</th>
          <th className="p-2">{t("total")}</th><th className="p-2">{t("qtyShipped")}</th><th className="p-2">{t("qtyInvoiced")}</th><th className="p-2">{t("status")}</th></tr></thead>
        <tbody>{visible.map((o) => (
          <tr key={o.id} onClick={() => onView(o)} className="cursor-pointer border-b border-border hover:bg-secondary">
            <td className="p-2 font-mono text-xs">{o.orderNumber}</td><td className="p-2 font-semibold">{o.customerName}</td>
            <td className="p-2">{o.deliveryDate ?? "—"}</td><td className="p-2 font-bold text-foreground">{formatCurrency(o.total)}</td>
            <td className="p-2 text-xs">{frac(o, "qtyShipped")}</td><td className="p-2 text-xs">{frac(o, "qtyInvoiced")}</td><td className="p-2">{st(o)}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{visible.map((o) => (
        <MobileCard key={o.id} title={o.customerName} amount={formatCurrency(o.total)} lines={[o.orderNumber, o.deliveryDate ?? undefined]}
          extra={<div className="pt-1">{st(o)}</div>} onView={() => onView(o)} />))}</div>
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
