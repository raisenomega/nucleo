import { useEffect, useState } from "react";
import { LucideIconPicker } from "@raisen-marketing/admin/LucideIconPicker";
import type { ProcessStepDraft, ProcessStepRow } from "@raisen-marketing/data/process.types";

const EMPTY: ProcessStepDraft = { stepNumber: 1, iconName: "UserPlus", titleEs: "", titleEn: "", descEs: "", descEn: "", displayOrder: 0, isActive: true };
const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Modal crear/editar paso (bilingüe). Nº paso = "01/02" visible; orden = posición en el timeline. Icon picker.
export function ProcessDialog({ initial, onClose, onSave }: { initial: ProcessStepRow | null; onClose: () => void; onSave: (s: ProcessStepDraft) => void }) {
  const [d, setD] = useState<ProcessStepDraft>(EMPTY);
  useEffect(() => setD(initial ?? EMPTY), [initial]);
  const set = (p: Partial<ProcessStepDraft>) => setD((x) => ({ ...x, ...p }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{d.id ? "Editar" : "Nuevo"} paso</h2>
        <LucideIconPicker value={d.iconName} onChange={(iconName) => set({ iconName })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Título ES" value={d.titleEs} onChange={(e) => set({ titleEs: e.target.value })} />
          <input className={F} placeholder="Título EN" value={d.titleEn} onChange={(e) => set({ titleEn: e.target.value })} />
          <textarea className={F} rows={2} placeholder="Descripción ES" value={d.descEs} onChange={(e) => set({ descEs: e.target.value })} />
          <textarea className={F} rows={2} placeholder="Descripción EN" value={d.descEn} onChange={(e) => set({ descEn: e.target.value })} />
          <label className="text-sm text-muted-foreground">Nº paso<input type="number" className={F} value={d.stepNumber} onChange={(e) => set({ stepNumber: Number(e.target.value) })} /></label>
          <label className="text-sm text-muted-foreground">Orden<input type="number" className={F} value={d.displayOrder} onChange={(e) => set({ displayOrder: Number(e.target.value) })} /></label>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} />Activo</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
