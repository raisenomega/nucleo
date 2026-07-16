import { useState } from "react";
import { Pencil } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { Pagination } from "@shared/components/Pagination";
import { useSession } from "@shared/providers/SessionProvider";
import { VoidControls } from "@shared/components/VoidControls";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import { ExpenseClassBadge } from "@finance/presentation/ExpenseClassBadge";
import { ExpenseClassChips } from "@finance/presentation/ExpenseClassChips";
import type { Expense, Result } from "@finance/domain/expense.types";

type Emp = { id: string; full_name: string };
type R = Result<null, string>;
// Filtrado por rol lo hace la RLS (116). El total EXCLUYE anuladas.
export function ExpenseTable({ rows, employees, classOf, onView, onEdit, onVoid, onDeleteForever }: {
  rows: readonly Expense[]; employees: Emp[]; classOf: (categoryId: string) => string | null;
  onView: (id: string) => void; onEdit?: (id: string) => void;
  onVoid: (id: string, reason: string) => Promise<R>; onDeleteForever: (id: string) => Promise<R>;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const isCeo = session?.role === "ceo";
  const nameOf = (id: string | null) => (id ? employees.find((e) => e.id === id)?.full_name ?? "—" : "—");
  const [page, setPage] = useState(1);
  const [cls, setCls] = useState("");
  const view = cls ? rows.filter((r) => classOf(r.categoryId) === cls) : rows;
  const total = view.filter((r) => !r.deletedAt).reduce((s, i) => s + i.amount, 0);
  const paged = view.slice((page - 1) * 12, page * 12);
  const th = "px-3 py-2 text-left font-bold";
  const vc = (i: Expense) => <VoidControls id={i.id} deletedAt={i.deletedAt} deletedByName={nameOf(i.deletedBy)}
    deletedReason={i.deletedReason} isCeo={isCeo} onVoid={onVoid} onDeleteForever={onDeleteForever} />;
  return (
    <>
    {isCeo && <ExpenseClassChips value={cls} onChange={(v) => { setCls(v); setPage(1); }} />}
    <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-body font-bold">{t("expenseList")} ({view.length})</h2>
        <span className="font-body font-bold text-foreground">{t("total")}: {formatCurrency(total)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("date")}</th><th className={th}>{t("category")}</th><th className={th}>{t("description")}</th>
            <th className={`${th} text-right`}>{t("amount")}</th><th className={th}>{t("paymentMethod")}</th><th className={th}>{t("paidBy")}</th><th className={`${th} text-right`}>{t("actions")}</th>
          </tr></thead>
          <tbody>
            {view.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>}
            {paged.map((i) => (
              <tr key={i.id} onClick={() => onView(i.id)}
                className={`cursor-pointer border-t border-border transition-colors hover:bg-secondary ${i.deletedAt ? "text-muted-foreground line-through opacity-60" : ""}`}>
                <td className="px-3 py-2">{i.date}</td>
                <td className="px-3 py-2"><span className="flex items-center gap-2">{i.categoryLabel} <ExpenseClassBadge value={classOf(i.categoryId)} /></span></td>
                <td className="px-3 py-2">{i.description}</td><td className="px-3 py-2 text-right font-semibold">{formatCurrency(i.amount)}</td>
                <td className="px-3 py-2">{i.paymentMethodLabel}</td><td className="px-3 py-2">{nameOf(i.paidBy)}</td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><div className="flex justify-end gap-2 no-underline">
                  {!i.deletedAt && onEdit && <button type="button" onClick={() => onEdit(i.id)} aria-label={t("edit")} className="text-foreground"><Pencil className="h-4 w-4" /></button>}
                  {vc(i)}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="space-y-2 md:hidden">
      {paged.map((i) => <MobileCard key={i.id} title={i.categoryLabel} amount={formatCurrency(i.amount)}
        lines={[`${i.date} · ${i.paymentMethodLabel}`, `${nameOf(i.paidBy)} · ${i.description}`]}
        extra={<span className="flex items-center gap-2"><ExpenseClassBadge value={classOf(i.categoryId)} />{vc(i)}</span>}
        onView={i.deletedAt ? undefined : () => onView(i.id)} onEdit={!i.deletedAt && onEdit ? () => onEdit(i.id) : undefined} />)}
    </div>
    <Pagination total={view.length} page={page} onPageChange={setPage} />
    </>
  );
}
