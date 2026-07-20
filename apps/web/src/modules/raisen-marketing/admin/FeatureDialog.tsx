import { useEffect, useState } from "react";
import { LucideIconPicker } from "@raisen-marketing/admin/LucideIconPicker";
import type { FeatureDraft, MarketingFeatureRow } from "@raisen-marketing/data/feature.types";

const EMPTY: FeatureDraft = { iconName: "Zap", titleEs: "", titleEn: "", descEs: "", descEn: "", bulletsEs: [], bulletsEn: [], displayOrder: 0, colSpan: 1, isActive: true };
const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Modal crear/editar feature (bilingüe). Bullets uno-por-línea (split \n · el repo limpia vacíos). Icon picker.
export function FeatureDialog({ initial, onClose, onSave }: { initial: MarketingFeatureRow | null; onClose: () => void; onSave: (f: FeatureDraft) => void }) {
  const [d, setD] = useState<FeatureDraft>(EMPTY);
  useEffect(() => setD(initial ?? EMPTY), [initial]);
  const set = (p: Partial<FeatureDraft>) => setD((x) => ({ ...x, ...p }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{d.id ? "Editar" : "Nueva"} feature</h2>
        <LucideIconPicker value={d.iconName} onChange={(iconName) => set({ iconName })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={F} placeholder="Título ES" value={d.titleEs} onChange={(e) => set({ titleEs: e.target.value })} />
          <input className={F} placeholder="Título EN" value={d.titleEn} onChange={(e) => set({ titleEn: e.target.value })} />
          <textarea className={F} rows={2} placeholder="Descripción ES" value={d.descEs} onChange={(e) => set({ descEs: e.target.value })} />
          <textarea className={F} rows={2} placeholder="Descripción EN" value={d.descEn} onChange={(e) => set({ descEn: e.target.value })} />
          <textarea className={F} rows={3} placeholder="Bullets ES (uno por línea)" value={d.bulletsEs.join("\n")} onChange={(e) => set({ bulletsEs: e.target.value.split("\n") })} />
          <textarea className={F} rows={3} placeholder="Bullets EN (uno por línea)" value={d.bulletsEn.join("\n")} onChange={(e) => set({ bulletsEn: e.target.value.split("\n") })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">Ancho
          <select className={F} value={d.colSpan} onChange={(e) => set({ colSpan: Number(e.target.value) })}><option value={1}>1 columna</option><option value={2}>2 columnas</option></select>
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave(d)} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
