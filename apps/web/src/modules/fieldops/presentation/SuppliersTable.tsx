import { useState } from "react";
import { Truck, Plus, Pencil, Power } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { Pagination } from "@shared/components/Pagination";
import type { Supplier } from "@fieldops/domain/supplier.types";

// FIX1 — sección de proveedores en la página de inventario (patrón nómina). CRUD gateado por inventory.edit.
export function SuppliersTable({ rows, onAdd, onEdit, onToggle }: {
  rows: readonly Supplier[]; onAdd: () => void; onEdit: (id: string) => void; onToggle: (s: Supplier) => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const manage = can("inventory", "edit");
  const [page, setPage] = useState(1);
  const paged = rows.slice((page - 1) * 12, page * 12);
  const th = "px-3 py-2 text-left text-xs font-bold uppercase text-muted-foreground";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
        <h2 className="flex items-center gap-2 font-body font-bold"><Truck className="h-4 w-4" />{t("suppliers")} ({rows.length})</h2>
        {manage && <button type="button" onClick={onAdd} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-body font-bold"><Plus className="h-4 w-4" /> {t("newSupplier")}</button>}
      </div>
      {rows.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{t("noSuppliers")}</p> : (
      <div className="overflow-x-auto"><table className="w-full font-body text-sm">
        <thead className="bg-secondary"><tr>
          <th className={th}>{t("name")}</th><th className={th}>{t("contactName")}</th><th className={th}>{t("phone")}</th><th className={th}>{t("email")}</th><th className={th}>{t("leadTime")}</th><th className={th}>{t("active")}</th><th className={`${th} text-right`}>{t("actions")}</th>
        </tr></thead>
        <tbody>{paged.map((s) => (
          <tr key={s.id} className={`border-t border-border ${s.active ? "" : "opacity-50"}`}>
            <td className="px-3 py-2 text-foreground">{s.name}</td><td className="px-3 py-2">{s.contactName || "—"}</td>
            <td className="px-3 py-2">{s.phone || "—"}</td><td className="px-3 py-2">{s.email || "—"}</td>
            <td className="px-3 py-2">{s.leadTimeDays != null ? `${s.leadTimeDays}d` : "—"}</td><td className="px-3 py-2">{s.active ? t("active") : "—"}</td>
            <td className="px-3 py-2"><div className="flex justify-end gap-3">
              {manage && <button type="button" onClick={() => onEdit(s.id)} aria-label={t("edit")}><Pencil className="h-4 w-4" /></button>}
              {manage && <button type="button" onClick={() => onToggle(s)} aria-label={t("active")} className={s.active ? "text-destructive" : "text-primary"}><Power className="h-4 w-4" /></button>}
            </div></td>
          </tr>
        ))}</tbody>
      </table></div>)}
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </div>
  );
}
