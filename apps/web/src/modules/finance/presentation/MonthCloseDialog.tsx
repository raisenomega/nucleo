import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@shared/lib/format";
import type { MonthTotals } from "@finance/domain/month-closure.types";

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium text-foreground">{formatCurrency(value)}</span></div>
);

// Dialog de confirmación de cierre. Muestra los totales EXACTOS que se congelan (preview_month_close, la misma
// agregación que close_month) antes de confirmar. Advierte que el bloqueo de edición aún no está activo (1.2b).
export function MonthCloseDialog({ label, loadPreview, onConfirm, onClose }: {
  label: string; loadPreview: () => Promise<MonthTotals | null>; onConfirm: () => Promise<void>; onClose: () => void;
}) {
  const [t, setT] = useState<MonthTotals | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void loadPreview().then(setT); }, [loadPreview]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">Cerrar {label}</h2>
        {!t ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <Row label="Ingresos" value={t.totalIncome} />
            <Row label="Gastos" value={t.totalExpenses} />
            <Row label="Nómina" value={t.totalPayroll} />
            <Row label="Extraordinarios" value={t.totalExtraordinary} />
            <div className="border-t border-border pt-2"><Row label="Balance neto" value={t.netBalance} /></div>
          </div>
        )}
        <p className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
          Al cerrar se congelan estos totales. El bloqueo de edición de transacciones se activará en una actualización próxima.
        </p>
        <div className="flex gap-2">
          <button type="button" disabled={busy || !t} onClick={async () => { setBusy(true); await onConfirm(); }}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {busy ? "Cerrando…" : "Confirmar cierre"}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
