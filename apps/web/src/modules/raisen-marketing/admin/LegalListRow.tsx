import { Pencil, Trash2, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import type { LegalPageRow } from "@raisen-marketing/data/legal.types";

// Fila de una página legal en el editor: título + slug + link externo + reorder ↑↓ + toggle activa + editar/eliminar.
export function LegalListRow({ p, first, last, onMove, onToggle, onEdit, onDelete }: {
  p: LegalPageRow; first: boolean; last: boolean; onMove: (d: -1 | 1) => void; onToggle: (v: boolean) => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{p.titleEs} / {p.titleEn}</p>
        <p className="text-xs text-muted-foreground">/legal/{p.slug} · orden {p.displayOrder}</p>
      </div>
      <a href={`/legal/${p.slug}`} target="_blank" rel="noreferrer" aria-label="ver" className="rounded p-1 text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
      <button type="button" onClick={() => onMove(-1)} disabled={first} aria-label="subir" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
      <button type="button" onClick={() => onMove(1)} disabled={last} aria-label="bajar" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
      <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={p.isActive} onChange={(e) => onToggle(e.target.checked)} />activa</label>
      <button type="button" onClick={onEdit} aria-label="editar" className="rounded p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
      <button type="button" onClick={onDelete} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
