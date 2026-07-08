import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { Pagination } from "@shared/components/Pagination";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { useSession } from "@shared/providers/SessionProvider";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import { ExpenseClassBadge } from "@finance/presentation/ExpenseClassBadge";
import type { Expense } from "@finance/domain/expense.types";

type Emp = { id: string; full_name: string };

export function ExpenseTable({ rows, employees, classOf, onView, onEdit, onDelete }: {
  rows: readonly Expense[]; employees: Emp[]; classOf: (categoryId: string) => string | null;
  onView: (id: string) => void; onEdit?: (id: string) => void; onDelete?: (id: string) => void;
}) {
  const { t } = useI18n();
  const { canEdit } = useRoleGate(); const { session } = useSession();
  // coo+ ven todo; roles menores solo lo que crearon (espejo de la RLS 00068).
  const visible = canEdit("coo") ? rows : rows.filter((r) => r.createdBy === session?.userId);
  const total = visible.reduce((s, i) => s + i.amount, 0);
  const [page, setPage] = useState(1);
  const paged = visible.slice((page - 1) * 12, page * 12);
  const nameOf = (id: string) => employees.find((e) => e.id === id)?.full_name ?? "—";
  const th = "px-3 py-2 text-left font-bold";
  return (
    <>
    <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-body font-bold">{t("expenseList")} ({visible.length})</h2>
        <span className="font-body font-bold text-primary">{t("total")}: {formatCurrency(total)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("date")}</th><th className={th}>{t("category")}</th>
            <th className={th}>{t("description")}</th><th className={`${th} text-right`}>{t("amount")}</th>
            <th className={th}>{t("paymentMethod")}</th><th className={th}>{t("paidBy")}</th>
            <th className={`${th} text-right`}>{t("actions")}</th>
          </tr></thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>}
            {paged.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="px-3 py-2">{i.date}</td>
                <td className="px-3 py-2"><span className="flex items-center gap-2">{i.categoryLabel} <ExpenseClassBadge value={classOf(i.categoryId)} /></span></td>
                <td className="px-3 py-2">{i.description}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(i.amount)}</td>
                <td className="px-3 py-2">{i.paymentMethodLabel}</td>
                <td className="px-3 py-2">{nameOf(i.paidBy)}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => onView(i.id)} aria-label={t("viewDetail")} className="text-foreground"><Eye className="h-4 w-4" /></button>
                    {onEdit && <button type="button" onClick={() => onEdit(i.id)} aria-label={t("edit")} className="text-primary"><Pencil className="h-4 w-4" /></button>}
                    {onDelete && <button type="button" onClick={() => onDelete(i.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="space-y-2 md:hidden">
      {paged.map((i) => <MobileCard key={i.id} title={i.categoryLabel} amount={formatCurrency(i.amount)}
        lines={[`${i.date} · ${i.paymentMethodLabel}`, `${nameOf(i.paidBy)} · ${i.description}`]}
        extra={<ExpenseClassBadge value={classOf(i.categoryId)} />}
        onView={() => onView(i.id)} onEdit={onEdit ? () => onEdit(i.id) : undefined} onDelete={onDelete ? () => onDelete(i.id) : undefined} />)}
    </div>
    <Pagination total={visible.length} page={page} onPageChange={setPage} />
    </>
  );
}
