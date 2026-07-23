import { Lock, LockOpen, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@shared/lib/format";
import type { MonthClosure, MonthRecStatus } from "@finance/domain/month-closure.types";

// Una fila del panel de cierre: mes + estado (abierto/cerrado) + badge de conciliación + acción. El mes en curso
// viene con `current=true` → sin botón (debe terminar primero). `canManage` = CEO+.
export function MonthClosureRow({ label, current, closure, status, canManage, onClose, onReopen }: {
  label: string; current: boolean; closure: MonthClosure | undefined; status: MonthRecStatus | undefined;
  canManage: boolean; onClose: () => void; onReopen: () => void;
}) {
  const rec = status && status.totalLines > 0
    ? (status.unmatched === 0
      ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800 dark:bg-green-900/40 dark:text-green-300"><CheckCircle2 className="h-3 w-3" />conciliado</span>
      : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"><AlertTriangle className="h-3 w-3" />{status.unmatched} sin conciliar</span>)
    : null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        {closure ? <Lock className="h-4 w-4 text-primary" /> : <LockOpen className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm font-medium capitalize text-foreground">{label}</span>
        {closure && <span className="text-xs text-muted-foreground">· cerrado {new Date(closure.closedAt).toLocaleDateString()}</span>}
        {rec}
        {closure?.reconciliationDiff != null && <span className="text-[10px] text-muted-foreground" title="Diferencia banco vs libros congelada al cierre">Δ {formatCurrency(closure.reconciliationDiff)}</span>}
      </div>
      {current ? (
        <span className="text-xs text-muted-foreground" title="El mes debe terminar primero">En curso</span>
      ) : closure ? (
        canManage && <button type="button" onClick={onReopen} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">Reabrir</button>
      ) : (
        canManage && <button type="button" onClick={onClose} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Cerrar mes</button>
      )}
    </div>
  );
}
