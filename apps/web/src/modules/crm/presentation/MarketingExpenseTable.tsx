import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { Pagination } from "@shared/components/Pagination";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import type { MarketingExpense } from "@crm/domain/marketing.types";

export function MarketingExpenseTable({ rows, onView, onEdit, onDelete }: {
  rows: readonly MarketingExpense[]; onView: (id: string) => void; onEdit?: (id: string) => void; onDelete?: (id: string) => void;
}) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const visible = rows.slice((page - 1) * 12, page * 12);
  const total = rows.reduce((s, e) => s + e.amount, 0);
  const th = "px-3 py-2 text-left font-bold";
  return (
    <>
    <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-body font-bold">{t("mExpenseList")} ({rows.length})</h2>
        <span className="font-body font-bold text-primary">{t("total")}: {formatCurrency(total)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("date")}</th><th className={th}>{t("channel")}</th>
            <th className={th}>{t("campaignName")}</th><th className={th}>{t("description")}</th>
            <th className={`${th} text-right`}>{t("amount")}</th><th className={`${th} text-right`}>{t("actions")}</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && (<tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>)}
            {visible.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-3 py-2">{e.date}</td>
                <td className="px-3 py-2">{e.channel}</td>
                <td className="px-3 py-2">{e.campaignName || "—"}</td>
                <td className="px-3 py-2">{e.description}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(e.amount)}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => onView(e.id)} aria-label={t("viewDetail")} className="text-foreground"><Eye className="h-4 w-4" /></button>
                    {onEdit && <button type="button" onClick={() => onEdit(e.id)} aria-label={t("edit")} className="text-primary"><Pencil className="h-4 w-4" /></button>}
                    {onDelete && <button type="button" onClick={() => onDelete(e.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="space-y-2 md:hidden">
      {visible.map((e) => <MobileCard key={e.id} title={e.channel} amount={formatCurrency(e.amount)}
        lines={[`${e.date} · ${e.campaignName || "—"}`, e.description]}
        onView={() => onView(e.id)} onEdit={onEdit ? () => onEdit(e.id) : undefined} onDelete={onDelete ? () => onDelete(e.id) : undefined} />)}
    </div>
    <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
