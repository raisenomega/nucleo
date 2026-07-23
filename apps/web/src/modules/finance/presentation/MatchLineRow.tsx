import { formatCurrency } from "@shared/lib/format";
import type { MatchCandidate, StatementLine } from "@finance/domain/bank-statement.types";

// Una línea sin conciliar + sus candidatos automáticos + acciones (confirmar 1-clic / manual / crear / ignorar).
export function MatchLineRow({ line, candidates, onConfirm, onManual, onCreate, onIgnore }: {
  line: StatementLine; candidates: MatchCandidate[];
  onConfirm: (entryType: "income" | "expense", entryId: string) => void;
  onManual: () => void; onCreate: () => void; onIgnore: () => void;
}) {
  const btn = "rounded-lg px-2 py-1 text-xs font-bold";
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="min-w-0 truncate"><span className="text-muted-foreground">{line.txnDate}</span> · {line.description}</div>
        <span className={`shrink-0 font-bold ${line.amount < 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(line.amount)}</span>
      </div>
      {candidates.length > 0
        ? <div className="space-y-1">{candidates.map((c) => (
            <div key={c.entryId} className="flex items-center justify-between gap-2 rounded bg-secondary px-2 py-1 text-xs">
              <span className="min-w-0 truncate">{c.date} · {c.description || "—"} <span className="text-muted-foreground">(score {c.score})</span></span>
              <button type="button" onClick={() => onConfirm(c.entryType, c.entryId)} className={`${btn} shrink-0 bg-primary text-primary-foreground`}>Confirmar</button>
            </div>))}</div>
        : <p className="text-xs text-muted-foreground">Sin candidatos automáticos.</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onManual} className={`${btn} bg-secondary`}>Manual</button>
        <button type="button" onClick={onCreate} className={`${btn} bg-secondary`}>Crear {line.amount < 0 ? "gasto" : "ingreso"}</button>
        <button type="button" onClick={onIgnore} className={`${btn} bg-secondary text-muted-foreground`}>Ignorar</button>
      </div>
    </div>
  );
}
