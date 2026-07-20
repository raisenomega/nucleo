import { useEffect, useState } from "react";
import type { LegalDraft, LegalPageRow } from "@raisen-marketing/data/legal.types";

const EMPTY: LegalDraft = { slug: "", titleEs: "", titleEn: "", contentEs: "", contentEn: "", isActive: true, displayOrder: 0 };
const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Modal crear/editar página legal. Slug editable solo al crear (readonly al editar · es parte de la URL).
// Contenido = markdown (textarea monospace); se renderiza como markdown seguro en /legal/{slug}.
export function LegalDialog({ initial, onClose, onSave }: { initial: LegalPageRow | null; onClose: () => void; onSave: (d: LegalDraft) => void }) {
  const [d, setD] = useState<LegalDraft>(EMPTY);
  useEffect(() => setD(initial ?? EMPTY), [initial]);
  const set = (p: Partial<LegalDraft>) => setD((x) => ({ ...x, ...p }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-2xl space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{d.id ? "Editar" : "Nueva"} página legal</h2>
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Título ES" value={d.titleEs} onChange={(e) => set({ titleEs: e.target.value })} />
          <input className={F} placeholder="Título EN" value={d.titleEn} onChange={(e) => set({ titleEn: e.target.value })} />
        </div>
        <input className={F} placeholder="slug (ej: reembolsos)" value={d.slug} readOnly={!!d.id} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
        <textarea className={`${F} font-mono`} rows={7} placeholder="Contenido ES (markdown)" value={d.contentEs} onChange={(e) => set({ contentEs: e.target.value })} />
        <textarea className={`${F} font-mono`} rows={7} placeholder="Contenido EN (markdown)" value={d.contentEn} onChange={(e) => set({ contentEn: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} />Activa (visible en footer + URL)</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
