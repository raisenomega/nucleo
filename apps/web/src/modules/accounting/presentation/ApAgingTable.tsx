import { useMemo } from "react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { buildApAging, agingTotals } from "@accounting/domain/build-ap-aging";
import type { VendorBill } from "@accounting/domain/vendor-bill.types";

const COLS = [
  { key: "current", label: "agingCurrent", cls: "text-green-600" },
  { key: "b1_30", label: "aging1_30", cls: "text-amber-600" },
  { key: "b31_60", label: "aging31_60", cls: "text-orange-600" },
  { key: "b61_90", label: "aging61_90", cls: "text-red-600" },
  { key: "b90_plus", label: "aging90plus", cls: "text-red-700" },
] as const;

// Envejecimiento AP por proveedor (calculado desde los bills). Click en proveedor filtra la vista de facturas.
export function ApAgingTable({ bills, onSupplier }: { bills: readonly VendorBill[]; onSupplier: (id: string) => void }) {
  const { t } = useI18n();
  const rows = useMemo(() => buildApAging(bills), [bills]);
  const tot = useMemo(() => agingTotals(rows), [rows]);
  if (rows.length === 0) return <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">{t("noBills")}</div>;
  const th = "px-2 py-1 font-bold";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs font-bold text-muted-foreground">{t("totalPayable")}</div><p className="mt-1 font-display text-xl font-bold text-destructive">{formatCurrency(tot.total)}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs font-bold text-muted-foreground">{t("overdue")}</div><p className="mt-1 font-display text-xl font-bold text-red-600">{formatCurrency(tot.b1_30 + tot.b31_60 + tot.b61_90 + tot.b90_plus)}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs font-bold text-muted-foreground">{t("current")}</div><p className="mt-1 font-display text-xl font-bold text-green-600">{formatCurrency(tot.current)}</p></div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
          <th className={`${th} text-left`}>{t("supplier")}</th>{COLS.map((c) => <th key={c.key} className={`${th} text-right`}>{t(c.label)}</th>)}<th className={`${th} text-right`}>{t("total")}</th>
        </tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.supplierId} onClick={() => onSupplier(r.supplierId)} className="cursor-pointer border-t border-border hover:bg-secondary/50">
            <td className="px-2 py-1 font-medium">{r.supplierName}</td>
            {COLS.map((c) => <td key={c.key} className={`px-2 py-1 text-right ${r[c.key] > 0 ? c.cls : "text-muted-foreground"}`}>{r[c.key] > 0 ? formatCurrency(r[c.key]) : "—"}</td>)}
            <td className="px-2 py-1 text-right font-bold">{formatCurrency(r.total)}</td>
          </tr>))}
          <tr className="border-t-2 border-border bg-secondary/40 font-bold"><td className="px-2 py-1">{t("total")}</td>
            {COLS.map((c) => <td key={c.key} className="px-2 py-1 text-right">{formatCurrency(tot[c.key])}</td>)}<td className="px-2 py-1 text-right">{formatCurrency(tot.total)}</td></tr>
        </tbody>
      </table></div>
    </div>
  );
}
