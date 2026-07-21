import { useEffect, useState } from "react";
import type { FaqDraft, FaqRow } from "@raisen-marketing/data/faq.types";

const EMPTY: FaqDraft = { questionEs: "", questionEn: "", answerEs: "", answerEn: "", isActive: true, displayOrder: 0 };
const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Modal crear/editar pregunta. Bilingüe obligatorio: la landing y el JSON-LD se sirven en ES y EN, así que
// dejar un idioma vacío deja un hueco visible al visitante.
export function FaqDialog({ initial, onClose, onSave }: { initial: FaqRow | null; onClose: () => void; onSave: (f: FaqDraft) => void }) {
  const [d, setD] = useState<FaqDraft>(EMPTY);
  useEffect(() => setD(initial ?? EMPTY), [initial]);
  const set = (p: Partial<FaqDraft>) => setD((x) => ({ ...x, ...p }));
  const invalid = !d.questionEs.trim() || !d.questionEn.trim() || !d.answerEs.trim() || !d.answerEn.trim();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{d.id ? "Editar" : "Nueva"} pregunta</h2>
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Pregunta ES" value={d.questionEs} onChange={(e) => set({ questionEs: e.target.value })} />
          <input className={F} placeholder="Pregunta EN" value={d.questionEn} onChange={(e) => set({ questionEn: e.target.value })} />
          <textarea rows={6} className={F} placeholder="Respuesta ES" value={d.answerEs} onChange={(e) => set({ answerEs: e.target.value })} />
          <textarea rows={6} className={F} placeholder="Respuesta EN" value={d.answerEn} onChange={(e) => set({ answerEn: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} />Activa</label>
        {invalid && <p className="text-xs text-muted-foreground">Completa pregunta y respuesta en ambos idiomas.</p>}
        <div className="flex gap-2">
          <button type="button" disabled={invalid} onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-40">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
