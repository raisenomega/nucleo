import { useState } from "react";
import { AlertTriangle, Globe } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import { Pagination } from "@shared/components/Pagination";
import { InventoryRowActions } from "@fieldops/presentation/InventoryRowActions";
import { itemValue } from "@fieldops/application/inventory-analytics";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

const isLow = (i: InventoryItem) => i.minStock > 0 && i.stock <= i.minStock;
const loc = (i: InventoryItem) => [i.aisle, i.shelf, i.bin].filter(Boolean).join("-") || "—";

export function InventoryTable({ rows, slow, high, reorder, onView, onEdit, onDelete, onRestock, onAdjust, onShrink, onTransfer }: {
  rows: readonly InventoryItem[]; slow?: ReadonlySet<string>; high?: ReadonlySet<string>; reorder?: ReadonlySet<string>;
  onView: (id: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void;
  onRestock: (id: string) => void; onAdjust: (id: string) => void; onShrink: (id: string) => void; onTransfer: (id: string) => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const cost = can("inventory", "cost");
  const th = "px-3 py-2 text-left font-bold";
  const [page, setPage] = useState(1);
  const visible = rows.slice((page - 1) * 12, page * 12);
  const acts = { onRestock, onAdjust, onShrink, onTransfer, onEdit, onDelete };
  return (
    <>
    <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <div className="overflow-x-auto"><table className="w-full font-body text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
          <th className={th}>{t("itemName")}</th><th className={th}>{t("sku")}</th><th className={th}>{t("location")}</th><th className={`${th} text-right`}>{t("stock")}</th><th className={`${th} text-right`}>{t("minStock")}</th>
          {cost && <><th className={`${th} text-right`}>{t("unitCost")}</th><th className={`${th} text-right`}>{t("value")}</th></>}
          <th className={th}>{t("supplier")}</th><th className={th}>{t("lastRestock")}</th><th className={`${th} text-right`}>{t("actions")}</th>
        </tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={cost ? 10 : 8} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>}
          {visible.map((i) => (
            <tr key={i.id} onClick={() => onView(i.id)} className={`cursor-pointer border-t border-border hover:bg-secondary ${isLow(i) ? "bg-destructive/5" : ""}`}>
              <td className="px-3 py-2"><span className="inline-flex flex-wrap items-center gap-1">{i.name}{i.landingProductId && <span title={t("inCatalogTooltip")} className="text-primary"><Globe className="h-3.5 w-3.5" /></span>}{slow?.has(i.id) && <span className="rounded bg-amber-500/10 px-1 text-xs text-amber-600">{t("slowStock")}</span>}{high?.has(i.id) && <span className="rounded bg-destructive/10 px-1 text-xs text-destructive">{t("highConsumption")}</span>}{reorder?.has(i.id) && <span className="rounded bg-orange-500/10 px-1 text-xs text-orange-600">{t("reorderBadge")}</span>}</span></td>
              <td className="px-3 py-2 text-muted-foreground">{i.sku || "—"}</td>
              <td className="px-3 py-2 text-muted-foreground">{loc(i)}</td>
              <td className="px-3 py-2 text-right"><span className={`font-semibold ${isLow(i) ? "text-destructive" : ""}`}>{i.stock}</span>{isLow(i) && <AlertTriangle className="ml-1 inline h-3 w-3 text-destructive" />}</td>
              <td className="px-3 py-2 text-right">{i.minStock}</td>
              {cost && <><td className="px-3 py-2 text-right">{formatCurrency(i.unitCost)}</td><td className="px-3 py-2 text-right font-semibold">{formatCurrency(itemValue(i))}</td></>}
              <td className="px-3 py-2 text-muted-foreground">{i.supplierName || "—"}</td>
              <td className="px-3 py-2 text-muted-foreground">{i.lastRestockDate ? i.lastRestockDate.slice(0, 10) : "—"}</td>
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><InventoryRowActions id={i.id} {...acts} /></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
    <div className="space-y-2 md:hidden">
      {visible.map((i) => <MobileCard key={i.id} title={i.name} amount={cost ? formatCurrency(itemValue(i)) : undefined}
        lines={[`${t("stock")}: ${i.stock} · ${t("minStock")}: ${i.minStock}`, i.supplierName || ""]}
        extra={isLow(i) ? <span className="inline-flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" /> {t("lowStock")}</span> : undefined}
        onView={() => onView(i.id)} onEdit={can("inventory", "edit") ? () => onEdit(i.id) : undefined} onDelete={can("inventory", "delete") ? () => onDelete(i.id) : undefined} />)}
    </div>
    <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
