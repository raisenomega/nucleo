import { useState } from "react";
import { AlertTriangle, Eye, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import { Pagination } from "@shared/components/Pagination";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

export function InventoryTable({ rows, onView, onEdit, onDelete }: {
  rows: readonly InventoryItem[]; onView: (id: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const showCost = can("inventory", "cost"); // costo gateado por checkbox inventory.cost
  const th = "px-3 py-2 text-left font-bold";
  const [page, setPage] = useState(1);
  const visible = rows.slice((page - 1) * 12, page * 12);
  return (
    <>
    <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
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
            {visible.map((i) => (
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
                    {can("inventory", "edit") && <button type="button" onClick={() => onEdit(i.id)} aria-label={t("edit")} className="text-primary"><Pencil className="h-4 w-4" /></button>}
                    {can("inventory", "delete") && <button type="button" onClick={() => onDelete(i.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="space-y-2 md:hidden">
      {visible.map((i) => <MobileCard key={i.id} title={i.name} amount={showCost ? formatCurrency(i.unitCost) : undefined}
        lines={[`${t("stock")}: ${i.stock} · ${t("minStock")}: ${i.minStock}`]}
        extra={i.minStock > 0 && i.stock < i.minStock ? <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 text-xs text-destructive"><AlertTriangle className="h-3 w-3" /> {t("lowStock")}</span> : undefined}
        onView={() => onView(i.id)} onEdit={can("inventory", "edit") ? () => onEdit(i.id) : undefined} onDelete={can("inventory", "delete") ? () => onDelete(i.id) : undefined} />)}
    </div>
    <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
