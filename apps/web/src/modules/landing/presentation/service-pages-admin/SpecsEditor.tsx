import { X, Plus } from "lucide-react";
import { LucideIconPicker } from "@shared/components/LucideIconPicker";
import type { Json } from "@landing/domain/service-page-admin.types";

const MAX = 6;
const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
export function SpecsEditor({ specs, onChange }: { specs: Json[]; onChange: (s: Json[]) => void }) {
  const upd = (i: number, patch: Json) => onChange(specs.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-2">
      {specs.map((s, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
          <LucideIconPicker value={(s.icon as string) ?? null} onChange={(n) => upd(i, { icon: n })} />
          <input value={(s.label_es as string) ?? ""} onChange={(e) => upd(i, { label_es: e.target.value })} placeholder="Label ES" className={`${fld} flex-1`} />
          <input value={(s.value_es as string) ?? ""} onChange={(e) => upd(i, { value_es: e.target.value })} placeholder="Valor (ej: 250°F)" className={`${fld} flex-1`} />
          <input value={(s.value_en as string) ?? ""} onChange={(e) => upd(i, { value_en: e.target.value })} placeholder="Value EN" className={`${fld} flex-1`} />
          <button type="button" onClick={() => onChange(specs.filter((_, k) => k !== i))}><X className="h-4 w-4 text-destructive" /></button>
        </div>))}
      {specs.length < MAX && <button type="button" onClick={() => onChange([...specs, { icon: "Gauge", label_es: "", label_en: "", value_es: "", value_en: "" }])} className="flex items-center gap-1 text-sm text-foreground"><Plus className="h-4 w-4" /> +</button>}
    </div>
  );
}
