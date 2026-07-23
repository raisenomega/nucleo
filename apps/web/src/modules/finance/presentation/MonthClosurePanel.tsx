import { useMemo, useState } from "react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useMonthClosures } from "@finance/application/useMonthClosures.hook";
import { supabaseMonthClosureRepository as repo } from "@finance/infrastructure/supabase-month-closure.repository";
import { MonthClosureRow } from "@finance/presentation/MonthClosureRow";
import { MonthCloseDialog } from "@finance/presentation/MonthCloseDialog";

// Panel "Cierre de mes" (dentro de Conciliación). Lista los últimos 13 meses (el actual + 12 pasados) y su
// estado. Cerrar congela el snapshot financiero; NO bloquea aún la edición (eso es 1.2b — el dialog lo dice).
export function MonthClosurePanel() {
  const { locale } = useI18n();
  const toast = useToast();
  const { can } = useModuleAccess();
  const m = useMonthClosures(repo);
  const [dialog, setDialog] = useState<{ y: number; mo: number; label: string } | null>(null);
  const canManage = can("reconciliation", "fiscal");

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 13 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { y: d.getFullYear(), mo: d.getMonth() + 1, current: i === 0,
        label: d.toLocaleDateString(locale, { month: "long", year: "numeric" }) };
    });
  }, [locale]);
  const closureOf = (y: number, mo: number) => m.closures.find((c) => c.periodYear === y && c.periodMonth === mo);
  const recOf = (y: number, mo: number) => m.recStatus.find((s) => s.periodYear === y && s.periodMonth === mo);

  const doReopen = async (y: number, mo: number) => {
    const reason = window.prompt("Motivo de la reapertura (mínimo 5 caracteres):");
    if (reason === null) return;
    const r = await m.reopen(y, mo, reason);
    r.ok ? toast.success("Mes reabierto") : toast.error(r.error);
  };
  const doConfirm = async () => {
    if (!dialog) return;
    const r = await m.close(dialog.y, dialog.mo);
    setDialog(null);
    r.ok ? toast.success("Mes cerrado ✓") : toast.error(r.error);
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div><h2 className="font-display text-lg font-bold text-foreground">Cierre de mes</h2>
        <p className="text-xs text-muted-foreground">Congela los totales y bloquea la edición de transacciones del período. Reábrelo para ajustar.</p></div>
      {m.loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : (
        <div className="space-y-2">
          {months.map((mm) => (
            <MonthClosureRow key={`${mm.y}-${mm.mo}`} label={mm.label} current={mm.current}
              closure={closureOf(mm.y, mm.mo)} status={recOf(mm.y, mm.mo)} canManage={canManage}
              onClose={() => setDialog({ y: mm.y, mo: mm.mo, label: mm.label })}
              onReopen={() => void doReopen(mm.y, mm.mo)} />
          ))}
        </div>
      )}
      {dialog && <MonthCloseDialog label={dialog.label} status={recOf(dialog.y, dialog.mo)} loadPreview={() => m.preview(dialog.y, dialog.mo)}
        onConfirm={doConfirm} onClose={() => setDialog(null)} />}
    </div>
  );
}
