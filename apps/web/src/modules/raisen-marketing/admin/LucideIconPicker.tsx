import { useState } from "react";
import { FEATURE_ICON_NAMES, featureIcon } from "@raisen-marketing/data/feature-icons";

// Icon picker: buscador + grilla de íconos lucide. El seleccionado se resalta en dorado (primary).
export function LucideIconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [q, setQ] = useState("");
  const names = FEATURE_ICON_NAMES.filter((n) => n.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-2">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ícono" className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground" />
      <div className="grid max-h-40 grid-cols-6 gap-2 overflow-y-auto rounded-lg border border-border p-2">
        {names.map((n) => {
          const Icon = featureIcon(n);
          return (
            <button key={n} type="button" onClick={() => onChange(n)} title={n}
              className={`grid aspect-square place-items-center rounded-lg ${value === n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
