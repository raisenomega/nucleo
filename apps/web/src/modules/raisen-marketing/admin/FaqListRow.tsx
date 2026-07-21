import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { FaqRow } from "@raisen-marketing/data/faq.types";

// Fila de una pregunta en el editor: pregunta (truncada) · activa + reorder ↑↓ + editar + eliminar.
export function FaqListRow({ f, first, last, onMove, onToggleActive, onEdit, onDelete }: {
  f: FaqRow; first: boolean; last: boolean; onMove: (d: -1 | 1) => void; onToggleActive: (v: boolean) => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{f.questionEs}</p>
        <p className="truncate text-xs text-muted-foreground">{f.questionEn} · orden {f.displayOrder}</p>
      </div>
      <button type="button" onClick={() => onMove(-1)} disabled={first} aria-label="subir" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
      <button type="button" onClick={() => onMove(1)} disabled={last} aria-label="bajar" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
      <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={f.isActive} onChange={(e) => onToggleActive(e.target.checked)} />activa</label>
      <button type="button" onClick={onEdit} aria-label="editar" className="rounded p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
      <button type="button" onClick={onDelete} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
