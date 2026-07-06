import { AlertTriangle, Eye, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { formatCurrency } from "@shared/lib/format";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

export function InventoryTable({ rows, onView, onEdit, onDelete }: {
  rows: readonly InventoryItem[]; onView: (id: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const { canEdit } = useRoleGate();
  const showCost = canEdit("coo");
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4"><h2 className="font-body font-bold">{t("inventoryList")} ({rows.length})</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("itemName")}</th><th className={`${th} text-right`}>{t("stock")}</th>
            {showCost && <th className={`${th} text-right`}>{t("unitCost")}</th>}
            <th className={`${th} text-right`}>{t("minStock")}</th><th className={`${th} text-right`}>{t("actions")}</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={showCost ? 5 : 4} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>
            )}
            {rows.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="px-3 py-2">{i.name}</td>
                <td className="px-3 py-2 text-right">
                  <span className="font-semibold">{i.stock}</span>
                  {i.minStock > 0 && i.stock < i.minStock && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" /> {t("lowStock")}
                    </span>
                  )}
                </td>
                {showCost && <td className="px-3 py-2 text-right">{formatCurrency(i.unitCost)}</td>}
                <td className="px-3 py-2 text-right">{i.minStock}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => onView(i.id)} aria-label={t("viewDetail")} className="text-foreground"><Eye className="h-4 w-4" /></button>
                    {canEdit("operaciones") && <button type="button" onClick={() => onEdit(i.id)} aria-label={t("edit")} className="text-primary"><Pencil className="h-4 w-4" /></button>}
                    {canEdit("coo") && <button type="button" onClick={() => onDelete(i.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
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
