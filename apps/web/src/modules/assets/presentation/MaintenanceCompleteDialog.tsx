import { useState } from "react";
import { X } from "lucide-react";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { MaintenancePlan } from "@assets/domain/asset.types";

// 2.7b · marca un plan como hecho: fecha + odómetro (si es por km) + costo + notas → registra en el log.
export function MaintenanceCompleteDialog({ plan, onDone, onClose }: {
  plan: MaintenancePlan; onDone: (date: string, odometer: number | null, cost: number, notes: string) => void; onClose: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [odo, setOdo] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4"><h2 className="font-display text-lg font-bold text-foreground">Marcar hecho · {plan.name}</h2><button type="button" onClick={onClose} aria-label="Cerrar"><X className="h-6 w-6" /></button></div>
      <div className="space-y-3 p-4">
        <label className="block space-y-1"><span className={lbl}>Fecha</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fld} /></label>
        {plan.recurrenceType === "meter" && <label className="block space-y-1"><span className={lbl}>Odómetro</span><input type="number" value={odo} onChange={(e) => setOdo(e.target.value)} className={fld} /></label>}
        <label className="block space-y-1"><span className={lbl}>Costo</span><input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className={fld} /></label>
        <label className="block space-y-1"><span className={lbl}>Notas</span><input value={notes} onChange={(e) => setNotes(e.target.value)} className={fld} /></label>
        <button type="button" onClick={() => onDone(date, odo ? Number(odo) : null, cost ? Number(cost) : 0, notes)} className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">Registrar</button>
      </div>
    </ScreenModal>
  );
}
