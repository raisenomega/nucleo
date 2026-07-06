import { Eye, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { useSession } from "@shared/providers/SessionProvider";
import { formatCurrency } from "@shared/lib/format";
import type { ExtraPayment } from "@finance/domain/extraordinary.types";

export function ExtraordinaryTable({ rows, onView, onEdit, onDelete }: {
  rows: readonly ExtraPayment[];
  onView: (id: string) => void; onEdit?: (id: string) => void; onDelete?: (id: string) => void;
}) {
  const { t } = useI18n();
  const { canEdit } = useRoleGate(); const { session } = useSession();
  // coo+ ven todo; roles menores solo lo que crearon (espejo de la RLS 00068).
  const visible = canEdit("coo") ? rows : rows.filter((r) => r.createdBy === session?.userId);
  const total = visible.reduce((s, i) => s + i.amount, 0);
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-body font-bold">{t("extraordinaryList")} ({visible.length})</h2>
        <span className="font-body font-bold text-primary">{t("total")}: {formatCurrency(total)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("date")}</th><th className={th}>{t("category")}</th>
            <th className={th}>{t("justification")}</th><th className={`${th} text-right`}>{t("amount")}</th>
            <th className={th}>{t("paymentMethod")}</th><th className={`${th} text-right`}>{t("actions")}</th>
          </tr></thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>
            )}
            {visible.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="px-3 py-2">{i.date}</td>
                <td className="px-3 py-2">{i.categoryLabel}</td>
                <td className="max-w-xs truncate px-3 py-2">{i.justification}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(i.amount)}</td>
                <td className="px-3 py-2">{i.paymentMethodLabel}</td>
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
  );
}
