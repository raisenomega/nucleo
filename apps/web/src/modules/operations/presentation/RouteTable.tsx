import { useState } from "react";
import { Pencil } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { MobileCard } from "@shared/components/MobileCard";
import { Pagination } from "@shared/components/Pagination";
import { useSession } from "@shared/providers/SessionProvider";
import { VoidControls } from "@shared/components/VoidControls";
import type { ServiceRoute, RepoResult } from "@operations/domain/route.types";

type Emp = { id: string; full_name: string };
const COLOR: Record<string, string> = {
  "Planificada": "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300", "En progreso": "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  "Completada": "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300", "Cancelada": "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

// onVoid llama void_route (cascada a stops); onDeleteForever hard-delete (solo CEO, ya anulada).
export function RouteTable({ rows, employees, onView, onEdit, onVoid, onDeleteForever }: {
  rows: readonly ServiceRoute[]; employees: Emp[]; onView: (id: string) => void; onEdit?: (id: string) => void;
  onVoid: (id: string, reason: string) => Promise<RepoResult>; onDeleteForever: (id: string) => Promise<RepoResult>;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const isCeo = session?.role === "ceo";
  const nameOf = (id: string | null) => (id ? employees.find((e) => e.id === id)?.full_name ?? "—" : "—");
  const th = "px-3 py-2 text-left font-bold";
  const [page, setPage] = useState(1);
  const visible = rows.slice((page - 1) * 12, page * 12);
  const vc = (r: ServiceRoute) => <VoidControls id={r.id} deletedAt={r.deletedAt} deletedByName={nameOf(r.deletedBy)}
    deletedReason={r.deletedReason} isCeo={isCeo} onVoid={onVoid} onDeleteForever={onDeleteForever} />;
  return (
    <>
    <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <div className="border-b border-border p-4"><h2 className="font-body font-bold">{t("routes")} ({rows.length})</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("date")}</th><th className={th}>{t("employee")}</th>
            <th className={th}>{t("routeStops")}</th><th className={th}>{t("status")}</th>
            <th className={`${th} text-right`}>{t("actions")}</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>}
            {visible.map((r) => (
              <tr key={r.id} onClick={() => onView(r.id)}
                className={`cursor-pointer border-t border-border transition-colors hover:bg-secondary ${r.deletedAt ? "text-muted-foreground line-through opacity-60" : ""}`}>
                <td className="px-3 py-2">{r.routeDate}</td>
                <td className="px-3 py-2">{nameOf(r.assignedTo)}</td>
                <td className="px-3 py-2">{r.completedCount}/{r.stopCount}</td>
                <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs font-bold ${COLOR[r.status] ?? "bg-secondary"}`}>{r.status}</span></td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><div className="flex justify-end gap-2 no-underline">
                  {!r.deletedAt && onEdit && <button type="button" onClick={() => onEdit(r.id)} aria-label={t("edit")} className="text-foreground"><Pencil className="h-4 w-4" /></button>}
                  {vc(r)}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="space-y-2 md:hidden">
      {visible.map((r) => <MobileCard key={r.id} title={`${r.routeDate} · ${nameOf(r.assignedTo)}`}
        lines={[`${r.completedCount}/${r.stopCount} ${t("routeStops")}`]}
        extra={<span className="flex items-center gap-2"><span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${COLOR[r.status] ?? "bg-secondary"}`}>{r.status}</span>{vc(r)}</span>}
        onView={r.deletedAt ? undefined : () => onView(r.id)} onEdit={!r.deletedAt && onEdit ? () => onEdit(r.id) : undefined} />)}
    </div>
    <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
