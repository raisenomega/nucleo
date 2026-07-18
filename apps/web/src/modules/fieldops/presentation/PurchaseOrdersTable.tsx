import { useState } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { Pagination } from "@shared/components/Pagination";
import type { PurchaseOrder, POStatus } from "@fieldops/domain/purchase-order.types";

export const PO_STATUS: Record<POStatus, { key: TranslationKey; cls: string }> = {
  draft: { key: "poDraft", cls: "bg-secondary text-muted-foreground" },
  ordered: { key: "poOrdered", cls: "bg-blue-500/10 text-blue-600" },
  partial: { key: "poPartial", cls: "bg-amber-500/10 text-amber-600" },
  received: { key: "poReceived", cls: "bg-green-500/10 text-green-600" },
  cancelled: { key: "poCancelled", cls: "bg-destructive/10 text-destructive" },
};

// FIX3 — sección órdenes de compra + botón sugerencias de reorden.
export function PurchaseOrdersTable({ rows, onAdd, onView, onSuggest }: {
  rows: readonly PurchaseOrder[]; onAdd: () => void; onView: (id: string) => void; onSuggest: () => void;
}) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const paged = rows.slice((page - 1) * 12, page * 12);
  const th = "px-3 py-2 text-left text-xs font-bold uppercase text-muted-foreground";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
        <h2 className="flex items-center gap-2 font-body font-bold"><ShoppingCart className="h-4 w-4" />{t("purchaseOrders")} ({rows.length})</h2>
        <div className="flex gap-2">
          <button type="button" onClick={onSuggest} className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-body font-bold">{t("reorderSuggestions")}</button>
          <button type="button" onClick={onAdd} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-body font-bold"><Plus className="h-4 w-4" /> {t("newPurchaseOrder")}</button>
        </div>
      </div>
      {rows.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{t("noPurchaseOrders")}</p> : (
      <div className="overflow-x-auto"><table className="w-full font-body text-sm">
        <thead className="bg-secondary"><tr><th className={th}>#</th><th className={th}>{t("supplier")}</th><th className={th}>{t("items")}</th><th className={`${th} text-right`}>{t("total")}</th><th className={th}>{t("status")}</th><th className={th}>{t("expectedDate")}</th></tr></thead>
        <tbody>{paged.map((o) => (
          <tr key={o.id} onClick={() => onView(o.id)} className="cursor-pointer border-t border-border hover:bg-secondary">
            <td className="px-3 py-2 font-semibold">PO-{o.orderNumber}</td><td className="px-3 py-2">{o.supplierName}</td><td className="px-3 py-2">{o.items.length}</td>
            <td className="px-3 py-2 text-right font-semibold">{formatCurrency(o.totalCost)}</td>
            <td className="px-3 py-2"><span className={`rounded px-1.5 py-0.5 text-xs font-bold ${PO_STATUS[o.status].cls}`}>{t(PO_STATUS[o.status].key)}</span></td>
            <td className="px-3 py-2 text-muted-foreground">{o.expectedAt ? o.expectedAt.slice(0, 10) : "—"}</td>
          </tr>
        ))}</tbody>
      </table></div>)}
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </div>
  );
}
