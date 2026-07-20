import { useEffect, useState } from "react";
import { LucideIconPicker } from "@raisen-marketing/admin/LucideIconPicker";
import type { SolutionDraft, SolutionRow, PillPreset } from "@raisen-marketing/data/solution.types";

const EMPTY: SolutionDraft = { iconName: "Zap", titleEs: "", titleEn: "", descEs: "", descEn: "", bulletsEs: [], bulletsEn: [], ctaLabelEs: "", ctaLabelEn: "", ctaHref: "#lead-form", pillPreset: null, isHighlighted: false, badgeEs: "", badgeEn: "", isActive: true, displayOrder: 0 };
const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Modal crear/editar bloque. Icon picker + bullets uno-por-línea. pill_preset pre-marca la pill del lead form.
// Highlight (exclusivo · el repo desmarca los demás) habilita los inputs de badge ES/EN.
export function SolutionDialog({ initial, onClose, onSave }: { initial: SolutionRow | null; onClose: () => void; onSave: (s: SolutionDraft) => void }) {
  const [d, setD] = useState<SolutionDraft>(EMPTY);
  useEffect(() => setD(initial ?? EMPTY), [initial]);
  const set = (p: Partial<SolutionDraft>) => setD((x) => ({ ...x, ...p }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{d.id ? "Editar" : "Nuevo"} bloque</h2>
        <LucideIconPicker value={d.iconName} onChange={(iconName) => set({ iconName })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Título ES" value={d.titleEs} onChange={(e) => set({ titleEs: e.target.value })} />
          <input className={F} placeholder="Título EN" value={d.titleEn} onChange={(e) => set({ titleEn: e.target.value })} />
          <textarea className={F} rows={2} placeholder="Descripción ES" value={d.descEs} onChange={(e) => set({ descEs: e.target.value })} />
          <textarea className={F} rows={2} placeholder="Descripción EN" value={d.descEn} onChange={(e) => set({ descEn: e.target.value })} />
          <textarea className={F} rows={3} placeholder="Bullets ES (uno por línea)" value={d.bulletsEs.join("\n")} onChange={(e) => set({ bulletsEs: e.target.value.split("\n") })} />
          <textarea className={F} rows={3} placeholder="Bullets EN (uno por línea)" value={d.bulletsEn.join("\n")} onChange={(e) => set({ bulletsEn: e.target.value.split("\n") })} />
          <input className={F} placeholder="CTA ES" value={d.ctaLabelEs} onChange={(e) => set({ ctaLabelEs: e.target.value })} />
          <input className={F} placeholder="CTA EN" value={d.ctaLabelEn} onChange={(e) => set({ ctaLabelEn: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="CTA href (#lead-form)" value={d.ctaHref} onChange={(e) => set({ ctaHref: e.target.value })} />
          <select className={F} value={d.pillPreset ?? ""} onChange={(e) => set({ pillPreset: (e.target.value || null) as PillPreset | null })}><option value="">Pill: ninguna</option><option value="business">business</option><option value="partner">partner</option></select>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={d.isHighlighted} onChange={(e) => set({ isHighlighted: e.target.checked })} />Destacado (solo 1 a la vez)</label>
        {d.isHighlighted && <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Badge ES" value={d.badgeEs ?? ""} onChange={(e) => set({ badgeEs: e.target.value })} />
          <input className={F} placeholder="Badge EN" value={d.badgeEn ?? ""} onChange={(e) => set({ badgeEn: e.target.value })} />
        </div>}
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} />Activo</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
