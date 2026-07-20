import { useState } from "react";
import { useToast } from "@shared/providers/toast-context";
import { saveSolutionsConfig } from "@raisen-marketing/infrastructure/marketing-solutions.repository";
import type { SolutionsConfig } from "@raisen-marketing/data/solution.types";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Editor del encabezado de la sección Soluciones (eyebrow + título ES/EN).
export function SolutionsConfigEditor({ config }: { config: SolutionsConfig }) {
  const toast = useToast();
  const [c, setC] = useState(config);
  const set = (p: Partial<SolutionsConfig>) => setC((x) => ({ ...x, ...p }));
  const save = async () => { const e = await saveSolutionsConfig(c); if (e) toast.error(e); else toast.success("Config guardada"); };
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="font-display text-lg font-bold text-foreground">Encabezado de la sección</h2>
      <div className="grid grid-cols-2 gap-2">
        <input className={F} placeholder="Eyebrow ES" value={c.eyebrowEs} onChange={(e) => set({ eyebrowEs: e.target.value })} />
        <input className={F} placeholder="Eyebrow EN" value={c.eyebrowEn} onChange={(e) => set({ eyebrowEn: e.target.value })} />
        <input className={F} placeholder="Título ES" value={c.titleEs} onChange={(e) => set({ titleEs: e.target.value })} />
        <input className={F} placeholder="Título EN" value={c.titleEn} onChange={(e) => set({ titleEn: e.target.value })} />
      </div>
      <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">Guardar config</button>
    </div>
  );
}
