import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { MobileCard } from "@shared/components/MobileCard";
import { Pagination } from "@shared/components/Pagination";
import { DN_ST_KEY, DN_ST_COLOR } from "@sales/presentation/delivery-note-ui";
import type { DeliveryNote } from "@sales/domain/delivery-note.types";

export function DeliveryNotesTable({ rows, onView }: { rows: readonly DeliveryNote[]; onView: (d: DeliveryNote) => void }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noDeliveryNotes")}</p>;
  const visible = rows.slice((page - 1) * 12, page * 12);
  const st = (d: DeliveryNote) => <span className={`rounded px-2 py-0.5 text-xs font-bold ${DN_ST_COLOR[d.status]}`}>{t(DN_ST_KEY[d.status])}</span>;
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("noteNumber")}</th><th className="p-2">{t("salesOrders")}</th><th className="p-2">{t("clientName")}</th>
          <th className="p-2">{t("dispatchDate")}</th><th className="p-2">{t("deliveryDate")}</th><th className="p-2">{t("items")}</th><th className="p-2">{t("status")}</th></tr></thead>
        <tbody>{visible.map((d) => (
          <tr key={d.id} onClick={() => onView(d)} className="cursor-pointer border-b border-border hover:bg-secondary">
            <td className="p-2 font-mono text-xs">{d.noteNumber}</td><td className="p-2 font-mono text-xs text-muted-foreground">{d.salesOrderNumber ?? "—"}</td>
            <td className="p-2 font-semibold">{d.customerName}</td><td className="p-2">{d.dispatchDate ?? "—"}</td>
            <td className="p-2">{d.deliveryDate ?? "—"}</td><td className="p-2 text-xs">{d.items.length}</td><td className="p-2">{st(d)}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{visible.map((d) => (
        <MobileCard key={d.id} title={d.customerName} lines={[d.noteNumber, d.salesOrderNumber ?? undefined]}
          extra={<div className="pt-1">{st(d)}</div>} onView={() => onView(d)} />))}</div>
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
