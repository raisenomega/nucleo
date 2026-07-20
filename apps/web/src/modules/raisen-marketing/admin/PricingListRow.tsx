import { Pencil, Trash2, ArrowUp, ArrowDown, Star } from "lucide-react";
import type { PricingTierRow } from "@raisen-marketing/data/pricing.types";

// Fila de un plan en el editor: nombre · precio/período · recomendado (★ exclusivo) + activo + reorder ↑↓ + editar + eliminar.
export function PricingListRow({ t, first, last, onMove, onToggleActive, onToggleRec, onEdit, onDelete }: {
  t: PricingTierRow; first: boolean; last: boolean; onMove: (d: -1 | 1) => void; onToggleActive: (v: boolean) => void; onToggleRec: (v: boolean) => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{t.nameEs} / {t.nameEn}{t.isRecommended && <Star className="ml-1 inline h-3 w-3 fill-primary text-primary" />}</p>
        <p className="text-xs text-muted-foreground">${t.price.toLocaleString()} {t.currency}/{t.billingPeriod} · orden {t.displayOrder}</p>
      </div>
      <button type="button" onClick={() => onMove(-1)} disabled={first} aria-label="subir" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
      <button type="button" onClick={() => onMove(1)} disabled={last} aria-label="bajar" className="rounded p-1 text-muted-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
      <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={t.isRecommended} onChange={(e) => onToggleRec(e.target.checked)} />rec</label>
      <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={t.isActive} onChange={(e) => onToggleActive(e.target.checked)} />activo</label>
      <button type="button" onClick={onEdit} aria-label="editar" className="rounded p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
      <button type="button" onClick={onDelete} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
