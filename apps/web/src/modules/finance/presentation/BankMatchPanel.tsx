import { useCallback, useEffect, useState } from "react";
import { Wand2 } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { formatCurrency } from "@shared/lib/format";
import { supabaseBankStatementRepository as lineRepo } from "@finance/infrastructure/supabase-bank-statement.repository";
import { supabaseBankMatchRepository as repo } from "@finance/infrastructure/supabase-bank-match.repository";
import { MatchLineRow } from "@finance/presentation/MatchLineRow";
import { MatchedLineRow } from "@finance/presentation/MatchedLineRow";
import { ManualMatchModal } from "@finance/presentation/ManualMatchModal";
import { CreateEntryModal } from "@finance/presentation/CreateEntryModal";
import type { MatchEntry, StatementLine, Suggestion } from "@finance/domain/bank-statement.types";
import type { BankAccount } from "@finance/domain/bank-account.types";

// Ola 2.5b · workqueue de conciliación por partida: sugerir candidatos + confirmar/manual/crear/ignorar/desvincular.
export function BankMatchPanel({ accounts, canWrite, month }: { accounts: readonly BankAccount[]; canWrite: boolean; month: string }) {
  const toast = useToast();
  const [acct, setAcct] = useState(accounts[0]?.id ?? "");
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [sug, setSug] = useState<Record<string, Suggestion>>({});
  const [manual, setManual] = useState<StatementLine | null>(null);
  const [create, setCreate] = useState<StatementLine | null>(null);
  const load = useCallback(async () => { if (!acct) { setLines([]); return; } setLines(await lineRepo.listLines({ bankAccountId: acct, month })); setSug({}); }, [acct, month]);
  useEffect(() => { void load(); }, [load]);
  const suggest = async () => { const s = await repo.suggest(acct, month); setSug(Object.fromEntries(s.map((x) => [x.lineId, x]))); toast.success(`${s.length} líneas analizadas`); };
  const act = async (p: Promise<{ ok: boolean; error?: string }>, msg: string) => { const r = await p; if (r.ok) { toast.success(msg); void load(); } else toast.error(r.error ?? "Error"); };
  const confirm = (line: StatementLine, entries: MatchEntry[]) => { setManual(null); void act(repo.confirm(line.id, entries), "Conciliada"); };
  const unmatched = lines.filter((l) => l.matchStatus === "unmatched");
  const matched = lines.filter((l) => l.matchStatus === "matched");
  const pend = unmatched.reduce((s, l) => s + Math.abs(l.amount), 0);
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground">Conciliación por partida</h3>
        <div className="flex gap-2">
          <select value={acct} onChange={(e) => setAcct(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm">{accounts.map((a) => <option key={a.id} value={a.id}>{a.bankName}</option>)}</select>
          {canWrite && <button type="button" onClick={() => void suggest()} disabled={!acct || !unmatched.length} className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold disabled:opacity-50"><Wand2 className="h-4 w-4" />Sugerir</button>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{lines.length} líneas · {matched.length} conciliadas · {unmatched.length} sin conciliar · {formatCurrency(pend)} pendiente</p>
      {unmatched.map((l) => (
        <MatchLineRow key={l.id} line={l} candidates={sug[l.id]?.candidates ?? []}
          onConfirm={(et, eid) => confirm(l, [{ entryType: et, entryId: eid, amount: Math.abs(l.amount) }])}
          onManual={() => setManual(l)} onCreate={() => setCreate(l)}
          onIgnore={() => { if (window.confirm("¿Ignorar esta línea?")) void act(repo.ignore(l.id, "Ignorada manualmente"), "Ignorada"); }} />))}
      {matched.length > 0 && <div className="space-y-1 border-t border-border pt-2">
        {matched.map((l) => <MatchedLineRow key={l.id} line={l} canWrite={canWrite} onUnmatch={() => void act(repo.unmatch(l.id), "Desvinculada")} />)}</div>}
      {manual && <ManualMatchModal line={manual} month={month} onClose={() => setManual(null)} onConfirm={(e) => confirm(manual, e)} />}
      {create && <CreateEntryModal line={create} onClose={() => setCreate(null)} onConfirm={(c, p) => { setCreate(null); void act(repo.createEntry(create.id, c, p), "Entrada creada y conciliada"); }} />}
    </div>
  );
}
