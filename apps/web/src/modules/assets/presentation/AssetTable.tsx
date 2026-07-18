import { useState } from "react";
import { Wrench, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { Pagination } from "@shared/components/Pagination";
import { assetValue, expiringSoon } from "@assets/application/asset-helpers";
import { ASSET_TYPE, CONDITION, STATUS } from "@assets/presentation/asset-labels";
import type { Asset } from "@assets/domain/asset.types";

export function AssetTable({ rows, now, onView, onEdit, onDelete, onMaintain }: {
  rows: readonly Asset[]; now: Date; onView: (id: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void; onMaintain: (id: string) => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const cost = can("assets", "cost"); const edit = can("assets", "edit");
  const th = "px-3 py-2 text-left font-bold";
  const [page, setPage] = useState(1);
  const visible = rows.slice((page - 1) * 12, page * 12);
  return (
    <>
    <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <div className="overflow-x-auto"><table className="w-full font-body text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
          <th className={th}>{t("name")}</th><th className={th}>{t("assetType")}</th><th className={th}>{t("status")}</th><th className={th}>{t("assignedTo")}</th>
          {cost && <th className={`${th} text-right`}>{t("value")}</th>}<th className={th}>{t("condition")}</th><th className={`${th} text-right`}>{t("actions")}</th>
        </tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={cost ? 7 : 6} className="py-8 text-center text-muted-foreground">{t("noAssets")}</td></tr>}
          {visible.map((a) => (
            <tr key={a.id} onClick={() => onView(a.id)} className="cursor-pointer border-t border-border hover:bg-secondary">
              <td className="px-3 py-2"><span className="inline-flex flex-wrap items-center gap-1">{a.name}{expiringSoon(a, now) && <span title={t("warrantyAlert")} className="inline-flex items-center rounded bg-destructive/10 px-1 text-xs text-destructive"><ShieldAlert className="h-3 w-3" /></span>}</span></td>
              <td className="px-3 py-2">{t(ASSET_TYPE[a.assetType])}</td>
              <td className="px-3 py-2"><span className={`rounded px-1.5 py-0.5 text-xs font-bold ${STATUS[a.status].cls}`}>{t(STATUS[a.status].key)}</span></td>
              <td className="px-3 py-2 text-muted-foreground">{a.assignedToName || "—"}</td>
              {cost && <td className="px-3 py-2 text-right font-semibold">{formatCurrency(assetValue(a))}</td>}
              <td className="px-3 py-2">{t(CONDITION[a.condition])}</td>
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><div className="flex justify-end gap-2">
                {edit && <button type="button" onClick={() => onMaintain(a.id)} aria-label={t("registerMaintenance")} className="text-amber-600"><Wrench className="h-4 w-4" /></button>}
                {edit && <button type="button" onClick={() => onEdit(a.id)} aria-label={t("edit")}><Pencil className="h-4 w-4" /></button>}
                {can("assets", "delete") && <button type="button" onClick={() => onDelete(a.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
    <div className="space-y-2 md:hidden">
      {visible.map((a) => (
        <button key={a.id} type="button" onClick={() => onView(a.id)} className="block w-full rounded-lg border border-border bg-card p-3 text-left">
          <div className="flex justify-between"><span className="font-bold">{a.name}</span><span className={`rounded px-1.5 text-xs font-bold ${STATUS[a.status].cls}`}>{t(STATUS[a.status].key)}</span></div>
          <p className="text-xs text-muted-foreground">{t(ASSET_TYPE[a.assetType])} · {a.assignedToName || "—"}{cost && ` · ${formatCurrency(assetValue(a))}`}</p>
        </button>
      ))}
    </div>
    <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
