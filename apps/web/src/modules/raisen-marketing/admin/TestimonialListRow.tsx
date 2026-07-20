import { Pencil, Trash2, ArrowUp, ArrowDown, Star } from "lucide-react";
import { initials, avatarHsl } from "@raisen-marketing/data/avatar-initials";
import type { TestimonialRow } from "@raisen-marketing/data/testimonial.types";

// Fila de un testimonio en el editor: avatar/iniciales + nombre + empresa + rating + reorder ↑↓ + toggle + editar/eliminar.
export function TestimonialListRow({ t, first, last, onMove, onToggle, onEdit, onDelete }: {
  t: TestimonialRow; first: boolean; last: boolean; onMove: (d: -1 | 1) => void; onToggle: (v: boolean) => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      {t.avatarUrl
        ? <img src={t.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
        : <div style={{ background: avatarHsl(t.clientName) }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white">{initials(t.clientName)}</div>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{t.clientName}</p>
        <p className="truncate text-xs text-muted-foreground">{t.clientCompany} · orden {t.displayOrder}</p>
      </div>
      <span className="flex items-center gap-0.5 text-xs text-primary"><Star size={12} className="fill-primary text-primary" />{t.rating}</span>
      <button type="button" onClick={() => onMove(-1)} disabled={first} aria-label="subir" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
      <button type="button" onClick={() => onMove(1)} disabled={last} aria-label="bajar" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
      <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={t.isActive} onChange={(e) => onToggle(e.target.checked)} />activo</label>
      <button type="button" onClick={onEdit} aria-label="editar" className="rounded p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
      <button type="button" onClick={onDelete} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
