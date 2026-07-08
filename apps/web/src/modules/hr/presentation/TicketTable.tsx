import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { MobileCard } from "@shared/components/MobileCard";
import { Pagination } from "@shared/components/Pagination";
import { PRIO_KEY, PRIO_COLOR, TST_KEY, TST_COLOR } from "@hr/presentation/support-ui";
import type { Ticket } from "@hr/domain/support.types";

export function TicketTable({ rows, onView }: { rows: readonly Ticket[]; onView: (id: string) => void }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const visible = rows.slice((page - 1) * 12, page * 12);
  const prio = (x: Ticket) => <span className={`rounded px-2 py-0.5 text-xs font-bold ${PRIO_COLOR[x.priority]}`}>{t(PRIO_KEY[x.priority])}</span>;
  const st = (x: Ticket) => <span className={`rounded px-2 py-0.5 text-xs font-bold ${TST_COLOR[x.status]}`}>{t(TST_KEY[x.status])}</span>;
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("subject")}</th><th className="p-2">{t("category")}</th><th className="p-2">{t("priority")}</th>
          <th className="p-2">{t("status")}</th><th className="p-2">{t("assignedTo")}</th></tr></thead>
        <tbody>{visible.map((x) => (
          <tr key={x.id} onClick={() => onView(x.id)} className="cursor-pointer border-b border-border hover:bg-secondary">
            <td className="p-2 font-semibold">{x.subject}</td><td className="p-2">{x.categoryLabel ?? "—"}</td>
            <td className="p-2">{prio(x)}</td><td className="p-2">{st(x)}</td><td className="p-2">{x.assignedName ?? "—"}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{visible.map((x) => (
        <MobileCard key={x.id} title={x.subject} lines={[[x.categoryLabel, x.assignedName].filter(Boolean).join(" · ")]}
          extra={<div className="flex items-center gap-2 pt-1">{prio(x)} {st(x)}</div>} onView={() => onView(x.id)} />))}</div>
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
