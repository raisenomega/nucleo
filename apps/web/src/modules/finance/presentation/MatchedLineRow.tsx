import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency } from "@shared/lib/format";
import { supabaseBankMatchRepository as repo } from "@finance/infrastructure/supabase-bank-match.repository";
import type { LineMatchDetail, StatementLine } from "@finance/domain/bank-statement.types";

// Ola 2.5d · línea conciliada: expande para ver las N entradas que la componen (depósito agrupado) + desvincular.
export function MatchedLineRow({ line, canWrite, onUnmatch }: { line: StatementLine; canWrite: boolean; onUnmatch: () => void }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<LineMatchDetail[]>([]);
  const toggle = () => { if (!open) void repo.listLineMatches(line.id).then(setEntries); setOpen(!open); };
  return (
    <div className="text-xs">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={toggle} className="flex min-w-0 items-center gap-1 text-muted-foreground">
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{line.txnDate} · {line.description}</span></button>
        <span className="flex shrink-0 items-center gap-2"><span className="font-semibold text-green-600">{formatCurrency(line.amount)}</span>
          {canWrite && <button type="button" onClick={onUnmatch} className="font-bold text-destructive">Desvincular</button>}</span>
      </div>
      {open && <div className="ml-5 mt-1 space-y-0.5 border-l border-border pl-2">
        {entries.length === 0 ? <p className="text-muted-foreground">—</p> : entries.map((e) => (
          <div key={e.entryId} className="flex justify-between gap-2"><span className="min-w-0 truncate text-muted-foreground">{e.date} · {e.description || (e.entryType === "income" ? "ingreso" : "gasto")}</span>
            <span className="shrink-0 font-medium">{formatCurrency(e.amount)}</span></div>))}
      </div>}
    </div>
  );
}
