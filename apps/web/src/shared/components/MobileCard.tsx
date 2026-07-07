import { Eye, Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@shared/i18n";

// Card genérica para renderizar una fila de tabla en mobile. Dato principal arriba, acciones abajo.
export function MobileCard({ title, amount, lines, extra, onView, onEdit, onDelete }: {
  title: ReactNode; amount?: ReactNode; lines?: ReactNode[]; extra?: ReactNode;
  onView?: () => void; onEdit?: () => void; onDelete?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-1 rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-base font-semibold">{title}</span>
        {amount != null && <span className="shrink-0 text-base font-bold text-primary">{amount}</span>}
      </div>
      {lines?.map((l, i) => l ? <p key={i} className="text-sm text-muted-foreground">{l}</p> : null)}
      {extra}
      {(onView || onEdit || onDelete) && (
        <div className="flex justify-end gap-4 pt-1">
          {onView && <button type="button" onClick={onView} aria-label={t("viewDetail")} className="text-foreground"><Eye className="h-5 w-5" /></button>}
          {onEdit && <button type="button" onClick={onEdit} aria-label={t("edit")} className="text-primary"><Pencil className="h-5 w-5" /></button>}
          {onDelete && <button type="button" onClick={onDelete} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-5 w-5" /></button>}
        </div>
      )}
    </div>
  );
}
