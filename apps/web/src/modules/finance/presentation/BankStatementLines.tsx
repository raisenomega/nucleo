import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { formatCurrency } from "@shared/lib/format";
import { supabaseBankStatementRepository as repo } from "@finance/infrastructure/supabase-bank-statement.repository";
import type { ImportBatch, MatchStatus, StatementLine } from "@finance/domain/bank-statement.types";
import type { BankAccount } from "@finance/domain/bank-account.types";

const ST: Record<string, string> = { unmatched: "Sin conciliar", matched: "Conciliada", ignored: "Ignorada" };
const STC: Record<string, string> = { unmatched: "bg-amber-100 text-amber-800", matched: "bg-green-100 text-green-800", ignored: "bg-gray-100 text-gray-600" };

// Paso 4: lista de líneas en staging + tira de imports (con borrado). Sin acciones de match todavía (eso es 2.5b).
export function BankStatementLines({ accounts, canDelete }: { accounts: readonly BankAccount[]; canDelete: boolean }) {
  const toast = useToast();
  const [acct, setAcct] = useState("");
  const [status, setStatus] = useState<MatchStatus | "all">("all");
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const load = useCallback(async () => {
    const [l, b] = await Promise.all([repo.listLines({ bankAccountId: acct || undefined, status }), repo.listBatches(acct || undefined)]);
    setLines(l); setBatches(b);
  }, [acct, status]);
  useEffect(() => { void load(); }, [load]);
  const del = async (id: string) => { if (!window.confirm("¿Eliminar este import completo y sus líneas?")) return; const r = await repo.deleteBatch(id); if (r.ok) { toast.success("Import eliminado"); void load(); } else toast.error(r.error ?? "Error"); };
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const unmatched = lines.filter((l) => l.matchStatus === "unmatched").length;
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground">Líneas del banco</h3>
        <div className="flex gap-2">
          <select value={acct} onChange={(e) => setAcct(e.target.value)} className={fld}><option value="">Todas las cuentas</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.bankName}</option>)}</select>
          <select value={status} onChange={(e) => setStatus(e.target.value as MatchStatus | "all")} className={fld}><option value="all">Todas</option><option value="unmatched">Sin conciliar</option><option value="matched">Conciliadas</option><option value="ignored">Ignoradas</option></select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{lines.length} líneas · {unmatched} sin conciliar</p>
      {batches.length > 0 && <div className="flex flex-wrap gap-2">{batches.map((b) => (
        <span key={b.id} className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs">{b.fileName} ({b.rowCount})
          {canDelete && <button type="button" onClick={() => void del(b.id)} className="text-destructive" aria-label="Eliminar import"><Trash2 className="h-3 w-3" /></button>}</span>))}</div>}
      {lines.length === 0 ? <p className="py-3 text-center text-sm text-muted-foreground">Sin líneas importadas.</p>
        : <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead className="bg-secondary text-[10px] uppercase text-muted-foreground"><tr><th className="px-2 py-1 text-left">Fecha</th><th className="px-2 py-1 text-left">Descripción</th><th className="px-2 py-1 text-right">Monto</th><th className="px-2 py-1 text-right">Balance</th><th className="px-2 py-1 text-center">Estado</th></tr></thead>
          <tbody>{lines.map((l) => (<tr key={l.id} className="border-t border-border">
            <td className="px-2 py-1 text-muted-foreground">{l.txnDate}</td><td className="px-2 py-1">{l.description}</td>
            <td className={`px-2 py-1 text-right font-semibold ${l.amount < 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(l.amount)}</td>
            <td className="px-2 py-1 text-right text-muted-foreground">{l.runningBalance != null ? formatCurrency(l.runningBalance) : "—"}</td>
            <td className="px-2 py-1 text-center"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${STC[l.matchStatus]}`}>{ST[l.matchStatus]}</span></td></tr>))}</tbody>
        </table></div>}
    </div>
  );
}
