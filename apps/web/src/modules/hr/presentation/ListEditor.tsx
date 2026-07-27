import { Plus, X } from "lucide-react";

// Lista editable de strings (requisitos, skills, documentos, preguntas). Botón + para añadir, × para quitar.
export function ListEditor({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const set = (i: number, v: string) => onChange(items.map((x, j) => (j === i ? v : x)));
  return (
    <div className="space-y-1">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      {items.map((it, i) => (
        <div key={i} className="flex gap-1">
          <input value={it} onChange={(e) => set(i, e.target.value)} placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
            aria-label="×" className="shrink-0 px-1 text-destructive"><X className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ""])}
        className="flex items-center gap-1 text-xs font-bold text-primary"><Plus className="h-3 w-3" /> {label}</button>
    </div>
  );
}
