import { useState } from "react";
import { Users, Pencil, Power, Banknote } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { Pagination } from "@shared/components/Pagination";
import { formatCurrency } from "@shared/lib/format";
import { EXTERNAL_TYPE_LABEL } from "@finance/presentation/ExternalWorkerForm";
import type { ExternalWorker } from "@finance/domain/external-worker.types";

// Única sección de externos: un trabajador registrado por fila. Total pagado sale de payroll (paidOf). Click → editar ficha.
export function ExternalWorkersTable({ rows, paidOf, onPay, onEdit, onToggle }: {
  rows: readonly ExternalWorker[]; paidOf: (id: string) => number;
  onPay: (w: ExternalWorker) => void; onEdit: (id: string) => void; onToggle: (w: ExternalWorker) => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const money = can("payroll", "salary");
  const [page, setPage] = useState(1);
  const paged = rows.slice((page - 1) * 12, page * 12);
  const th = "px-3 py-2 text-left text-xs font-bold uppercase text-muted-foreground";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="flex items-center gap-2 font-body font-bold"><Users className="h-4 w-4" />{t("externalWorkers")} ({rows.length})</h2>
      </div>
      {rows.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{t("noExternalWorkers")}</p> : (
      <div className="overflow-x-auto"><table className="w-full font-body text-sm">
        <thead className="bg-secondary"><tr>
          <th className={th}>{t("name")}</th><th className={th}>{t("workerTypeLabel")}</th><th className={th}>{t("specialty")}</th><th className={th}>{t("phone")}</th><th className={th}>{t("department")}</th>
          {money && <th className={`${th} text-right`}>{t("totalPaid")}</th>}<th className={th}>{t("active")}</th><th className={`${th} text-right`}>{t("actions")}</th>
        </tr></thead>
        <tbody>{paged.map((w) => (
          <tr key={w.id} onClick={() => onEdit(w.id)} className={`cursor-pointer border-t border-border hover:bg-secondary ${w.active ? "" : "opacity-50"}`}>
            <td className="px-3 py-2 text-foreground">{w.fullName}</td>
            <td className="px-3 py-2">{t(EXTERNAL_TYPE_LABEL[w.workerType])}</td>
            <td className="px-3 py-2">{w.specialty || "—"}</td><td className="px-3 py-2">{w.phone || "—"}</td><td className="px-3 py-2">{w.department || "—"}</td>
            {money && <td className="px-3 py-2 text-right font-semibold">{formatCurrency(paidOf(w.id))}</td>}
            <td className="px-3 py-2">{w.active ? t("active") : "—"}</td>
            <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><div className="flex justify-end gap-3">
              {can("payroll", "create") && <button type="button" onClick={() => onPay(w)} aria-label={t("addPayment")} className="text-primary"><Banknote className="h-4 w-4" /></button>}
              {can("payroll", "edit") && <button type="button" onClick={() => onEdit(w.id)} aria-label={t("edit")}><Pencil className="h-4 w-4" /></button>}
              {can("payroll", "edit") && <button type="button" onClick={() => onToggle(w)} aria-label={t("active")} className={w.active ? "text-destructive" : "text-primary"}><Power className="h-4 w-4" /></button>}
            </div></td>
          </tr>
        ))}</tbody>
      </table></div>)}
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </div>
  );
}
