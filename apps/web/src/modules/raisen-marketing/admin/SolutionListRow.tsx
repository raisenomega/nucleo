import { Pencil, Trash2, ArrowUp, ArrowDown, Star } from "lucide-react";
import { featureIcon } from "@raisen-marketing/data/feature-icons";
import type { SolutionRow } from "@raisen-marketing/data/solution.types";

// Fila de un bloque en el editor: ícono + título + highlight/pill + reorder ↑↓ + toggle activo + editar/eliminar.
export function SolutionListRow({ s, first, last, onMove, onToggle, onEdit, onDelete }: {
  s: SolutionRow; first: boolean; last: boolean; onMove: (d: -1 | 1) => void; onToggle: (v: boolean) => void; onEdit: () => void; onDelete: () => void;
}) {
  const Icon = featureIcon(s.iconName);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Icon className="h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{s.titleEs}{s.isHighlighted && <Star className="ml-1 inline h-3 w-3 fill-primary text-primary" />}</p>
        <p className="truncate text-xs text-muted-foreground">{s.pillPreset ? `pill ${s.pillPreset}` : "sin pill"} · orden {s.displayOrder}</p>
      </div>
      <button type="button" onClick={() => onMove(-1)} disabled={first} aria-label="subir" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
      <button type="button" onClick={() => onMove(1)} disabled={last} aria-label="bajar" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
      <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={s.isActive} onChange={(e) => onToggle(e.target.checked)} />activo</label>
      <button type="button" onClick={onEdit} aria-label="editar" className="rounded p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
      <button type="button" onClick={onDelete} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
