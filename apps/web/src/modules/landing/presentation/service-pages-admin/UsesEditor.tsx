import { X, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { LucideIconPicker } from "@shared/components/LucideIconPicker";
import type { Json } from "@landing/domain/service-page-admin.types";

const MAX = 8;
const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
export function UsesEditor({ uses, onChange }: { uses: Json[]; onChange: (u: Json[]) => void }) {
  const upd = (i: number, patch: Json) => onChange(uses.map((u, k) => (k === i ? { ...u, ...patch } : u)));
  const move = (i: number, d: number) => { const a = [...uses]; const j = i + d; if (j < 0 || j >= a.length) return; const [x] = a.splice(i, 1); if (x) a.splice(j, 0, x); onChange(a); };
  return (
    <div className="space-y-2">
      {uses.map((u, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-2">
          <div className="flex items-center gap-2">
            <LucideIconPicker value={(u.icon as string) ?? null} onChange={(n) => upd(i, { icon: n })} />
            <button type="button" onClick={() => move(i, -1)} aria-label="↑"><ChevronUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => move(i, 1)} aria-label="↓"><ChevronDown className="h-4 w-4" /></button>
            <button type="button" onClick={() => onChange(uses.filter((_, k) => k !== i))} className="ml-auto"><X className="h-4 w-4 text-destructive" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2"><input value={(u.title_es as string) ?? ""} onChange={(e) => upd(i, { title_es: e.target.value })} placeholder="Título ES" className={fld} /><input value={(u.title_en as string) ?? ""} onChange={(e) => upd(i, { title_en: e.target.value })} placeholder="Title EN" className={fld} /></div>
          <div className="grid grid-cols-2 gap-2"><textarea value={(u.description_es as string) ?? ""} onChange={(e) => upd(i, { description_es: e.target.value })} placeholder="Desc ES" rows={2} className={fld} /><textarea value={(u.description_en as string) ?? ""} onChange={(e) => upd(i, { description_en: e.target.value })} placeholder="Desc EN" rows={2} className={fld} /></div>
        </div>))}
      {uses.length < MAX && <button type="button" onClick={() => onChange([...uses, { icon: "CheckCircle2", title_es: "", title_en: "", description_es: "", description_en: "" }])} className="flex items-center gap-1 text-sm text-foreground"><Plus className="h-4 w-4" /> +</button>}
    </div>
  );
}
