import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ScreenModal } from "@shared/components/ScreenModal";
import { formatCurrency } from "@shared/lib/format";
import { supabaseBankMatchRepository as repo } from "@finance/infrastructure/supabase-bank-match.repository";
import type { MatchEntry, StatementLine, UnmatchedEntry } from "@finance/domain/bank-statement.types";

// Selección múltiple para el caso agrupado (1 línea = N entradas). Habilita confirmar solo cuando la suma cuadra.
export function ManualMatchModal({ line, month, onClose, onConfirm }: {
  line: StatementLine; month: string; onClose: () => void; onConfirm: (e: MatchEntry[]) => void;
}) {
  const type: "income" | "expense" = line.amount < 0 ? "expense" : "income";
  const [entries, setEntries] = useState<UnmatchedEntry[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  useEffect(() => { void repo.listUnmatchedEntries(month, type).then(setEntries); }, [month, type]);
  const target = Math.abs(line.amount);
  const sum = entries.filter((e) => sel.has(e.entryId)).reduce((s, e) => s + e.amount, 0);
  const ok = Math.abs(sum - target) <= 0.01 && sel.size > 0;
  const toggle = (id: string) => setSel((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const confirm = () => onConfirm(entries.filter((e) => sel.has(e.entryId)).map((e) => ({ entryType: type, entryId: e.entryId, amount: e.amount })));
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">Match manual · {formatCurrency(line.amount)}</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar"><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs text-muted-foreground">Seleccioná {type === "income" ? "ingresos" : "gastos"} del mes hasta cuadrar {formatCurrency(target)}.</p>
        <div className="max-h-72 overflow-auto rounded-lg border border-border">{entries.length === 0
          ? <p className="p-3 text-center text-sm text-muted-foreground">Nada sin conciliar este mes.</p>
          : entries.map((e) => (
            <label key={e.entryId} className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-0">
              <input type="checkbox" checked={sel.has(e.entryId)} onChange={() => toggle(e.entryId)} />
              <span className="text-muted-foreground">{e.date}</span><span className="min-w-0 flex-1 truncate">{e.description || "—"}</span>
              <span className="shrink-0 font-semibold">{formatCurrency(e.amount)}</span></label>))}</div>
        <div className="flex items-center justify-between text-sm"><span>Seleccionado: <b>{formatCurrency(sum)}</b> de {formatCurrency(target)}</span>
          <span className={ok ? "text-green-600" : "text-muted-foreground"}>{ok ? "cuadra ✓" : `faltan ${formatCurrency(target - sum)}`}</span></div>
        <button type="button" disabled={!ok} onClick={confirm} className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">Confirmar match</button>
      </div>
    </ScreenModal>
  );
}
