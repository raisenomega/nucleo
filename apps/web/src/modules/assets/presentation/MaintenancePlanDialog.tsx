import { useState } from "react";
import { X } from "lucide-react";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { PlanFormData } from "@assets/domain/asset.types";

const EMPTY = (assetId: string): PlanFormData => ({ id: "", assetId, name: "", recurrenceType: "time", intervalDays: 90, intervalKm: null, lastDoneDate: new Date().toISOString().slice(0, 10), lastDoneOdometer: null, alertDaysBefore: 7, alertKmBefore: 500, isActive: true, notes: "" });

// 2.7b · alta/edición de un plan de mantenimiento (por tiempo o por kilometraje).
export function MaintenancePlanDialog({ assetId, initial, onSave, onClose }: {
  assetId: string; initial?: PlanFormData; onSave: (d: PlanFormData) => void; onClose: () => void;
}) {
  const [f, setF] = useState<PlanFormData>(initial ?? EMPTY(assetId));
  const set = (p: Partial<PlanFormData>) => setF((x) => ({ ...x, ...p }));
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  const time = f.recurrenceType === "time";
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4"><h2 className="font-display text-lg font-bold text-foreground">Plan de mantenimiento</h2><button type="button" onClick={onClose} aria-label="Cerrar"><X className="h-6 w-6" /></button></div>
      <div className="space-y-3 p-4">
        <label className="block space-y-1"><span className={lbl}>Nombre</span><input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Cambio de aceite" className={fld} /></label>
        <label className="block space-y-1"><span className={lbl}>Tipo</span>
          <select value={f.recurrenceType} onChange={(e) => set({ recurrenceType: e.target.value as "time" | "meter" })} className={fld}><option value="time">Por tiempo</option><option value="meter">Por kilometraje</option></select></label>
        {time
          ? <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1"><span className={lbl}>Cada N días</span><input type="number" value={f.intervalDays ?? ""} onChange={(e) => set({ intervalDays: Number(e.target.value) || null })} className={fld} /></label>
              <label className="space-y-1"><span className={lbl}>Avisar días antes</span><input type="number" value={f.alertDaysBefore} onChange={(e) => set({ alertDaysBefore: Number(e.target.value) })} className={fld} /></label>
              <label className="col-span-2 space-y-1"><span className={lbl}>Última vez (fecha)</span><input type="date" value={f.lastDoneDate ?? ""} onChange={(e) => set({ lastDoneDate: e.target.value })} className={fld} /></label>
            </div>
          : <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1"><span className={lbl}>Cada N km</span><input type="number" value={f.intervalKm ?? ""} onChange={(e) => set({ intervalKm: Number(e.target.value) || null })} className={fld} /></label>
              <label className="space-y-1"><span className={lbl}>Avisar km antes</span><input type="number" value={f.alertKmBefore} onChange={(e) => set({ alertKmBefore: Number(e.target.value) })} className={fld} /></label>
              <label className="col-span-2 space-y-1"><span className={lbl}>Odómetro última vez</span><input type="number" value={f.lastDoneOdometer ?? ""} onChange={(e) => set({ lastDoneOdometer: Number(e.target.value) || null })} className={fld} /></label>
            </div>}
        <button type="button" disabled={!f.name || (time ? !f.intervalDays : !f.intervalKm)} onClick={() => onSave(f)} className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">Guardar</button>
      </div>
    </ScreenModal>
  );
}
