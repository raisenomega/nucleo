import { Lock, LockOpen } from "lucide-react";
import type { MonthClosure } from "@finance/domain/month-closure.types";

// Una fila del panel de cierre: mes + estado (abierto/cerrado) + acción. El mes en curso viene con
// `current=true` → sin botón (debe terminar primero). `canManage` = CEO+.
export function MonthClosureRow({ label, current, closure, canManage, onClose, onReopen }: {
  label: string; current: boolean; closure: MonthClosure | undefined; canManage: boolean;
  onClose: () => void; onReopen: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        {closure ? <Lock className="h-4 w-4 text-primary" /> : <LockOpen className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm font-medium capitalize text-foreground">{label}</span>
        {closure && <span className="text-xs text-muted-foreground">· cerrado {new Date(closure.closedAt).toLocaleDateString()}</span>}
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
