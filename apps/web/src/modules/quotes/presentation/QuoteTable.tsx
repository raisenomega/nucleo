import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import { Pagination } from "@shared/components/Pagination";
import { QUOTE_ST_KEY, QUOTE_ST_COLOR } from "@quotes/presentation/quote-ui";
import type { Quote } from "@quotes/domain/quote.types";

export function QuoteTable({ rows, onView }: { rows: readonly Quote[]; onView: (q: Quote) => void }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const visible = rows.slice((page - 1) * 12, page * 12);
  const st = (q: Quote) => <span className={`rounded px-2 py-0.5 text-xs font-bold ${QUOTE_ST_COLOR[q.status]}`}>{t(QUOTE_ST_KEY[q.status])}</span>;
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("quoteNumber")}</th><th className="p-2">{t("clientName")}</th><th className="p-2">{t("status")}</th>
          <th className="p-2">{t("total")}</th><th className="p-2">{t("validUntil")}</th></tr></thead>
        <tbody>{visible.map((q) => (
          <tr key={q.id} onClick={() => onView(q)} className="cursor-pointer border-b border-border hover:bg-secondary">
            <td className="p-2 font-mono text-xs">{q.quoteNumber ?? "—"}</td><td className="p-2 font-semibold">{q.clientName}</td>
            <td className="p-2">{st(q)}</td><td className="p-2 font-bold text-foreground">{formatCurrency(q.total)}</td>
            <td className="p-2">{q.validUntil ?? "—"}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{visible.map((q) => (
        <MobileCard key={q.id} title={q.clientName} amount={formatCurrency(q.total)} lines={[q.quoteNumber ?? undefined, q.validUntil ?? undefined]}
          extra={<div className="pt-1">{st(q)}</div>} onView={() => onView(q)} />))}</div>
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
