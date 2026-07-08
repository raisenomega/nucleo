import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { MobileCard } from "@shared/components/MobileCard";
import { Pagination } from "@shared/components/Pagination";
import { DOC_CAT_KEY, DOC_ST_KEY, DOC_ST_COLOR } from "@documents/presentation/doc-ui";
import type { Doc } from "@documents/domain/document.types";

const soon = (d: Doc) => {
  if (d.status !== "active" || !d.expirationDate) return false;
  const days = (new Date(d.expirationDate).getTime() - Date.now()) / 86400000;
  return days <= d.reminderDays;
};

export function DocumentTable({ rows, onView }: { rows: readonly Doc[]; onView: (id: string) => void }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const visible = rows.slice((page - 1) * 12, page * 12);
  const cat = (d: Doc) => <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold">{t(DOC_CAT_KEY[d.category])}</span>;
  const st = (d: Doc) => <span className={`rounded px-2 py-0.5 text-xs font-bold ${DOC_ST_COLOR[d.status]}`}>{t(DOC_ST_KEY[d.status])}</span>;
  const warn = (d: Doc) => soon(d) ? <span title={t("expiringSoon")} className="text-amber-600"><AlertTriangle className="inline h-4 w-4" /></span> : null;
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("docTitle")}</th><th className="p-2">{t("category")}</th><th className="p-2">{t("status")}</th>
          <th className="p-2">{t("expirationDate")}</th></tr></thead>
        <tbody>{visible.map((d) => (
          <tr key={d.id} onClick={() => onView(d.id)} className="cursor-pointer border-b border-border hover:bg-secondary">
            <td className="p-2 font-semibold">{d.title}</td><td className="p-2">{cat(d)}</td>
            <td className="p-2">{st(d)} {warn(d)}</td><td className="p-2">{d.expirationDate ?? "—"}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{visible.map((d) => (
        <MobileCard key={d.id} title={d.title} lines={[d.expirationDate ?? undefined]}
          extra={<div className="flex items-center gap-2 pt-1">{cat(d)} {st(d)} {warn(d)}</div>} onView={() => onView(d.id)} />))}</div>
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
