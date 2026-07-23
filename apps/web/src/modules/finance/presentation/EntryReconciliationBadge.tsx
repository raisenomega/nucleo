import { useEffect, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { supabaseBankMatchRepository as repo } from "@finance/infrastructure/supabase-bank-match.repository";
import type { EntryRecon } from "@finance/domain/bank-statement.types";

// Ola 2.5d · muestra si un income/expense está conciliado con una línea bancaria (o pendiente).
export function EntryReconciliationBadge({ entryType, entryId }: { entryType: "income" | "expense"; entryId: string }) {
  const [rec, setRec] = useState<EntryRecon | null | undefined>(undefined);
  useEffect(() => { void repo.getEntryReconciliation(entryType, entryId).then(setRec); }, [entryType, entryId]);
  if (rec === undefined) return null;
  if (!rec) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground"><Clock className="h-3.5 w-3.5" />Pendiente de conciliar</span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800 dark:bg-green-900/40 dark:text-green-300"
      title={`Depositado el ${rec.txnDate} — ${rec.bankName}: ${rec.description}`}>
      <CheckCircle2 className="h-3.5 w-3.5" />Conciliado · {rec.txnDate}
    </span>
  );
}
