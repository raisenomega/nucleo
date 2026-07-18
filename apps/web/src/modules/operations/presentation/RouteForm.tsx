import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { RouteStopsEditor, emptyStop } from "@operations/presentation/RouteStopsEditor";
import type { RouteFormData, EditableStop, RouteStop } from "@operations/domain/route.types";

type Emp = { id: string; full_name: string };
type Vehicle = { id: string; name: string };
const toEditable = (s: RouteStop): EditableStop => ({ id: s.id, clientName: s.clientName, address: s.address, city: s.city ?? "", serviceType: s.serviceType, scheduledTime: s.scheduledTime, estimatedAmount: s.estimatedAmount, notes: s.notes ?? "", phone: s.phone ?? "" });

export function RouteForm({ employees, vehicles, initial, initialStops, onSubmit, onCancel }: {
  employees: Emp[]; vehicles: Vehicle[]; initial?: RouteFormData; initialStops?: readonly RouteStop[];
  onSubmit: (d: RouteFormData, stops: EditableStop[]) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const isServicio = session?.role === "servicio";
  const uid = session?.userId ?? "";
  const ownName = employees.find((e) => e.id === uid)?.full_name || session?.email || uid;
  const [f, setF] = useState<RouteFormData>(initial ?? { routeDate: "", assignedTo: "", notes: "", assetId: "" });
  const [stops, setStops] = useState<EditableStop[]>(initial ? [] : [emptyStop()]);
  useEffect(() => { if (initialStops && initialStops.length) setStops(initialStops.map(toEditable)); }, [initialStops]);
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const kept = stops.filter((s) => s.clientName && s.address);
    if (kept.some((s) => !s.scheduledTime)) { window.alert(t("stopTimeRequired")); return; }
    onSubmit({ ...f, assignedTo: isServicio ? uid : f.assignedTo }, kept);  // servicio: forzado a sí mismo
  };
  // Servicio no edita rutas ajenas (edge case pre-117: ruta que creó pero asignó a otro).
  if (isServicio && initial && initial.assignedTo && initial.assignedTo !== uid)
    return <div className="rounded-lg border border-border bg-card p-5 text-sm text-destructive">{t("cannotEditOthersRoute")}</div>;
  return (
    <form onSubmit={submit}
      className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold">{t("newRoute")}</h2>
      {/* El estado del día se DERIVA de los stops (Completada, En progreso, Planificada). NO agregar
          dropdown manual — la lógica vive en el mapper (deriveDayStatus) al listar. Ver B.3.c / migr 120. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1"><span className={lbl}>{t("date")}</span>
          <input type="date" required value={f.routeDate} onChange={(e) => setF({ ...f, routeDate: e.target.value })} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("employee")}</span>
          {isServicio
            ? <input type="text" readOnly value={ownName} className={`${fld} opacity-70`} />
            : <select required value={f.assignedTo} onChange={(e) => setF({ ...f, assignedTo: e.target.value })} className={fld}>
                <option value="">—</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}</select>}</label>
      </div>
      <label className="block space-y-1"><span className={lbl}>{t("assignedVehicle")}</span>
        <select value={f.assetId} onChange={(e) => setF({ ...f, assetId: e.target.value })} className={fld}>
          <option value="">—</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
      <label className="block space-y-1"><span className={lbl}>{t("notes")}</span>
        <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={fld} /></label>
      <div className="space-y-1"><span className={lbl}>{t("routeStops")}</span><RouteStopsEditor stops={stops} onChange={setStops} /></div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setStops([...stops, emptyStop()])} aria-label={t("addStop")}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-bold text-foreground">
          <Plus className="h-4 w-4" /><span className="hidden sm:inline">{t("addStop")}</span></button>
        <button type="button" onClick={onCancel} className="flex-1 rounded-lg bg-secondary px-3 py-2 text-sm">{t("cancel")}</button>
        <button type="submit" className="flex-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold">{t("save")}</button>
      </div>
    </form>
  );
}
