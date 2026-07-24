import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import type { ArraySpec } from "@campaigns/presentation/block-schemas";

type Rec = Record<string, unknown>;

// Editor genérico de un array de ítems (benefits/testimonials/pricing/faq/logo_bar/features_grid): agregar,
// quitar, reordenar ↑↓. Soporta ítems string (benefits) u objeto (el resto). Todo se guarda como string.
export function BlockArrayEditor({ spec, items, onChange }: { spec: ArraySpec; items: unknown[]; onChange: (v: unknown[]) => void }) {
  const list = Array.isArray(items) ? items : [];
  const val = (it: unknown, k: string): string => {
    const raw = spec.stringItem ? it : (it as Rec)?.[k];
    return raw == null ? "" : typeof raw === "boolean" ? (raw ? "1" : "") : String(raw);
  };
  const upd = (i: number, k: string, v: string) => onChange(list.map((it, j) => (j !== i ? it : spec.stringItem ? v : { ...(it as Rec), [k]: v })));
  const add = () => onChange([...list, spec.stringItem ? "" : {}]);
  const rm = (i: number) => onChange(list.filter((_, j) => j !== i));
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= list.length) return; const a = [...list]; const t = a[i]!; a[i] = a[j]!; a[j] = t; onChange(a); };
  const inp = "mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-2">
      {list.map((it, i) => (
        <div key={i} className="rounded-lg border border-border p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">{spec.itemLabel} {i + 1}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(i, -1)} className="p-1"><ChevronUp className="h-3 w-3" /></button>
              <button type="button" onClick={() => move(i, 1)} className="p-1"><ChevronDown className="h-3 w-3" /></button>
              <button type="button" onClick={() => rm(i)} className="p-1 text-red-500"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
          {spec.itemFields.map((f) => (
            <label key={f.key} className="block text-[11px] text-muted-foreground">{f.label}
              {f.kind === "bool" ? <input type="checkbox" checked={val(it, f.key) === "1"} onChange={(e) => upd(i, f.key, e.target.checked ? "1" : "")} className="ml-2 align-middle" />
                : f.kind === "area" ? <textarea className={inp} rows={2} value={val(it, f.key)} onChange={(e) => upd(i, f.key, e.target.value)} />
                : <input className={inp} value={val(it, f.key)} onChange={(e) => upd(i, f.key, e.target.value)} />}
            </label>
          ))}
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"><Plus className="h-3 w-3" /> Agregar {spec.itemLabel.toLowerCase()}</button>
    </div>
  );
}
