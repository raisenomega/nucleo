import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { RouteStopsEditor, emptyStop } from "@operations/presentation/RouteStopsEditor";
import type { RouteFormData, EditableStop, RouteStop } from "@operations/domain/route.types";

type Emp = { id: string; full_name: string };
const STATUS = ["Planificada", "En progreso", "Completada", "Cancelada"];
const toEditable = (s: RouteStop): EditableStop => ({ id: s.id, clientName: s.clientName, address: s.address, city: s.city ?? "", serviceType: s.serviceType, scheduledTime: s.scheduledTime, estimatedAmount: s.estimatedAmount, notes: s.notes ?? "", phone: s.phone ?? "" });

export function RouteForm({ employees, initial, initialStops, onSubmit, onCancel }: {
  employees: Emp[]; initial?: RouteFormData; initialStops?: readonly RouteStop[];
  onSubmit: (d: RouteFormData, stops: EditableStop[]) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<RouteFormData>(initial ?? { routeDate: "", assignedTo: "", status: "Planificada", notes: "" });
  const [stops, setStops] = useState<EditableStop[]>(initial ? [] : [emptyStop()]);
  useEffect(() => { if (initialStops && initialStops.length) setStops(initialStops.map(toEditable)); }, [initialStops]);
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f, stops.filter((s) => s.clientName && s.address)); }}
      className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold">{t("newRoute")}</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="space-y-1"><span className={lbl}>{t("date")}</span>
          <input type="date" required value={f.routeDate} onChange={(e) => setF({ ...f, routeDate: e.target.value })} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("employee")}</span>
          <select required value={f.assignedTo} onChange={(e) => setF({ ...f, assignedTo: e.target.value })} className={fld}>
            <option value="">—</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}</select></label>
        <label className="space-y-1"><span className={lbl}>{t("status")}</span>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={fld}>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
      </div>
      <label className="block space-y-1"><span className={lbl}>{t("notes")}</span>
        <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={fld} /></label>
      <div className="space-y-1"><span className={lbl}>{t("routeStops")}</span><RouteStopsEditor stops={stops} onChange={setStops} /></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setStops([...stops, emptyStop()])} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-bold text-primary"><Plus className="h-4 w-4" /> {t("addStop")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">{t("save")}</button>
      </div>
    </form>
  );
}
