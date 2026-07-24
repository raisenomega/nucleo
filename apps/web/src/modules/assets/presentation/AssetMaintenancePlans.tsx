import { useCallback, useEffect, useState } from "react";
import { Plus, Check, Trash2, Pencil } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { supabaseMaintenancePlanRepository as repo } from "@assets/infrastructure/supabase-maintenance-plan.repository";
import { MaintenancePlanDialog } from "@assets/presentation/MaintenancePlanDialog";
import { MaintenanceCompleteDialog } from "@assets/presentation/MaintenanceCompleteDialog";
import type { MaintenancePlan, PlanFormData } from "@assets/domain/asset.types";

const BADGE: Record<string, string> = { ok: "bg-green-100 text-green-800", due_soon: "bg-amber-100 text-amber-800", overdue: "bg-red-100 text-red-800" };
const LBL: Record<string, string> = { ok: "OK", due_soon: "Próximo", overdue: "Vencido" };
const toForm = (p: MaintenancePlan): PlanFormData => ({ id: p.id, assetId: p.assetId, name: p.name, recurrenceType: p.recurrenceType, intervalDays: p.intervalDays, intervalKm: p.intervalKm, lastDoneDate: p.lastDoneDate, lastDoneOdometer: p.lastDoneOdometer, alertDaysBefore: p.alertDaysBefore, alertKmBefore: p.alertKmBefore, isActive: p.isActive, notes: p.notes });

// 2.7b · sección de mantenimiento programado en el detalle del activo (planes + estado + completar).
export function AssetMaintenancePlans({ assetId, canEdit }: { assetId: string; canEdit: boolean }) {
  const toast = useToast();
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [edit, setEdit] = useState<PlanFormData | "new" | null>(null);
  const [done, setDone] = useState<MaintenancePlan | null>(null);
  const load = useCallback(async () => setPlans(await repo.status(assetId)), [assetId]);
  useEffect(() => { void load(); }, [load]);
  const save = async (d: PlanFormData) => { const r = await repo.upsert(d); setEdit(null); if (r.ok) { toast.success("Plan guardado"); void load(); } else toast.error(r.error); };
  const complete = async (p: MaintenancePlan, date: string, odo: number | null, cost: number, notes: string) => { const r = await repo.complete(p.id, date, odo, cost, notes); setDone(null); if (r.ok) { toast.success("Registrado"); void load(); } else toast.error(r.error); };
  const del = async (id: string) => { if (!window.confirm("¿Eliminar plan?")) return; const r = await repo.remove(id); if (r.ok) void load(); else toast.error(r.error); };
  const sub = (p: MaintenancePlan) => p.recurrenceType === "time" ? `cada ${p.intervalDays}d · ${p.nextDueDate ?? "—"}${p.daysUntil != null ? ` (${p.daysUntil}d)` : ""}` : `cada ${p.intervalKm}km${p.kmUntil != null ? ` · faltan ${p.kmUntil}km` : ""}`;
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-foreground">Mantenimiento programado</h3>
        {canEdit && <button type="button" onClick={() => setEdit("new")} className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-xs font-bold"><Plus className="h-3.5 w-3.5" />Plan</button>}</div>
      {plans.length === 0 ? <p className="text-xs text-muted-foreground">Sin planes de mantenimiento.</p> : plans.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2 border-t border-border pt-2 text-sm">
          <div className="min-w-0"><p className="truncate font-medium text-foreground">{p.name} <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${BADGE[p.status]}`}>{LBL[p.status]}</span></p>
            <p className="text-xs text-muted-foreground">{sub(p)}</p></div>
          {canEdit && <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setDone(p)} className="text-green-600" aria-label="Marcar hecho"><Check className="h-4 w-4" /></button>
            <button type="button" onClick={() => setEdit(toForm(p))} className="text-foreground" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => void del(p.id)} className="text-destructive" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
          </div>}
        </div>))}
      {edit && <MaintenancePlanDialog assetId={assetId} initial={edit === "new" ? undefined : edit} onSave={save} onClose={() => setEdit(null)} />}
      {done && <MaintenanceCompleteDialog plan={done} onDone={(d, o, c, n) => void complete(done, d, o, c, n)} onClose={() => setDone(null)} />}
    </div>
  );
}
