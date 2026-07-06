import { Eye, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { ServiceRoute } from "@operations/domain/route.types";

type Emp = { id: string; full_name: string };
const COLOR: Record<string, string> = {
  "Planificada": "bg-yellow-100 text-yellow-800", "En progreso": "bg-blue-100 text-blue-800",
  "Completada": "bg-green-100 text-green-800", "Cancelada": "bg-red-100 text-red-800",
};

export function RouteTable({ rows, employees, onView, onEdit, onDelete }: {
  rows: readonly ServiceRoute[]; employees: Emp[];
  onView: (id: string) => void; onEdit?: (id: string) => void; onDelete?: (id: string) => void;
}) {
  const { t } = useI18n();
  const nameOf = (id: string) => employees.find((e) => e.id === id)?.full_name ?? "—";
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4"><h2 className="font-body font-bold">{t("routes")} ({rows.length})</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("date")}</th><th className={th}>{t("employee")}</th>
            <th className={th}>{t("routeStops")}</th><th className={th}>{t("status")}</th>
            <th className={`${th} text-right`}>{t("actions")}</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">{r.routeDate}</td>
                <td className="px-3 py-2">{nameOf(r.assignedTo)}</td>
                <td className="px-3 py-2">{r.completedCount}/{r.stopCount}</td>
                <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs font-bold ${COLOR[r.status] ?? "bg-secondary"}`}>{r.status}</span></td>
                <td className="px-3 py-2"><div className="flex justify-end gap-2">
                  <button type="button" onClick={() => onView(r.id)} aria-label={t("viewDetail")} className="text-foreground"><Eye className="h-4 w-4" /></button>
                  {onEdit && <button type="button" onClick={() => onEdit(r.id)} aria-label={t("edit")} className="text-primary"><Pencil className="h-4 w-4" /></button>}
                  {onDelete && <button type="button" onClick={() => onDelete(r.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
