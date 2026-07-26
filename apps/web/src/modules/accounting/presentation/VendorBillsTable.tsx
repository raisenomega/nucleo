import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { Pagination } from "@shared/components/Pagination";
import { BILL_STATUS_META } from "@accounting/presentation/vendor-bill-ui";
import type { VendorBill } from "@accounting/domain/vendor-bill.types";

// Tabla de facturas de proveedores. Click en fila abre el detalle.
export function VendorBillsTable({ bills, onSelect }: { bills: readonly VendorBill[]; onSelect: (id: string) => void }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  if (bills.length === 0) return <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">{t("noBills")}</div>;
  const paged = bills.slice((page - 1) * 20, page * 20);
  const th = "px-2 py-1 text-left font-bold";
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
          <th className={th}>{t("internalNumber")}</th><th className={th}>{t("supplier")}</th><th className={th}>{t("dueDate")}</th>
          <th className={`${th} text-right`}>{t("total")}</th><th className={`${th} text-right`}>{t("billBalance")}</th><th className={th}>{t("state")}</th>
        </tr></thead>
        <tbody>{paged.map((b) => { const st = BILL_STATUS_META[b.status]; const late = b.daysOverdue > 0 && b.balance > 0;
          return (
            <tr key={b.id} onClick={() => onSelect(b.id)} className="cursor-pointer border-t border-border hover:bg-secondary/50">
              <td className="px-2 py-1 font-mono text-xs">{b.internalNumber}<span className="ml-1 text-muted-foreground">·{b.billNumber}</span></td>
              <td className="px-2 py-1">{b.supplierName}</td>
              <td className={`px-2 py-1 ${late ? "font-bold text-destructive" : "text-muted-foreground"}`}>{b.dueDate}{late ? ` · ${b.daysOverdue}d` : ""}</td>
              <td className="px-2 py-1 text-right">{formatCurrency(b.total)}</td>
              <td className={`px-2 py-1 text-right font-semibold ${b.balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>{formatCurrency(b.balance)}</td>
              <td className="px-2 py-1"><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${st.cls}`}>{t(st.key)}</span></td>
            </tr>); })}</tbody>
      </table></div>
      <Pagination total={bills.length} page={page} pageSize={20} onPageChange={setPage} />
    </div>
  );
}
