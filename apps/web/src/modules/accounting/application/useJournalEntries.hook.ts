import { useCallback, useEffect, useState } from "react";
import type { JournalEntry, AccountBalance, JournalFilters, IJournalEntryRepository } from "@accounting/domain/journal-entry.types";

// DI del repo. Carga asientos (por filtros) y el balance de comprobación (por período).
export function useJournalEntries(repo: IJournalEntryRepository, filters: JournalFilters, view: "entries" | "trial") {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [trial, setTrial] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);   // el BC contabilidad muestra el fallo en la vista
  const { periodYear, periodMonth, accountId, sourceType, status, search } = filters;
  const load = useCallback(async () => {
    setLoading(true);
    if (view === "entries") { setEntries(await repo.list(filters)); setError(null); }
    else { const r = await repo.trialBalance(periodYear, periodMonth); setTrial(r.ok ? r.value : []); setError(r.ok ? null : r.error); }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, view, periodYear, periodMonth, accountId, sourceType, status, search]);
  useEffect(() => { void load(); }, [load]);
  return { entries, trial, loading, error, reload: load };
}
