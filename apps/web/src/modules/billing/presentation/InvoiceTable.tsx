import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import { Pagination } from "@shared/components/Pagination";
import { INV_ST_KEY, INV_ST_COLOR } from "@billing/presentation/billing-ui";
import type { Invoice } from "@billing/domain/invoice.types";

export function InvoiceTable({ rows, onView }: { rows: readonly Invoice[]; onView: (inv: Invoice) => void }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const visible = rows.slice((page - 1) * 12, page * 12);
  const st = (i: Invoice) => <span className={`rounded px-2 py-0.5 text-xs font-bold ${INV_ST_COLOR[i.status]}`}>{t(INV_ST_KEY[i.status])}</span>;
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("invoiceNumber")}</th><th className="p-2">{t("clientName")}</th><th className="p-2">{t("status")}</th>
          <th className="p-2">{t("total")}</th><th className="p-2">{t("dueDate")}</th></tr></thead>
        <tbody>{visible.map((i) => (
          <tr key={i.id} onClick={() => onView(i)} className="cursor-pointer border-b border-border hover:bg-secondary">
            <td className="p-2 font-mono text-xs">{i.invoiceNumber ?? "—"}</td><td className="p-2 font-semibold">{i.clientName}</td>
            <td className="p-2">{st(i)}</td><td className="p-2 font-bold text-primary">{formatCurrency(i.total)}</td>
            <td className="p-2">{i.dueDate ?? "—"}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{visible.map((i) => (
        <MobileCard key={i.id} title={i.clientName} amount={formatCurrency(i.total)} lines={[i.invoiceNumber ?? undefined, i.dueDate ?? undefined]}
          extra={<div className="pt-1">{st(i)}</div>} onView={() => onView(i)} />))}</div>
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
