import { useCallback, useEffect, useState } from "react";
import type { IQuoteRepository, Quote, QuoteInput, QuoteStatus, QuotesSummary } from "@quotes/domain/quote.types";

const EMPTY: QuotesSummary = { draft: 0, sent: 0, accepted: 0, rejected: 0, expired: 0, total_quoted: 0 };

export function useQuotes(repo: IQuoteRepository) {
  const [list, setList] = useState<Quote[]>([]);
  const [summary, setSummary] = useState<QuotesSummary>(EMPTY);
  const load = useCallback(async () => {
    const [l, s] = await Promise.all([repo.list(), repo.summary()]);
    setList(l); setSummary(s);
  }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const save = useCallback(async (d: QuoteInput) => { const r = await repo.save(d); if (r.ok) await load(); return r; }, [repo, load]);
  const update = useCallback(async (id: string, d: QuoteInput) => { const r = await repo.update(id, d); if (r.ok) await load(); return r; }, [repo, load]);
  const setStatus = useCallback(async (id: string, st: QuoteStatus) => { const r = await repo.setStatus(id, st); if (r.ok) await load(); return r; }, [repo, load]);
  const convert = useCallback(async (id: string) => { const inv = await repo.convertToInvoice(id); await load(); return inv; }, [repo, load]);
  return { list, summary, save, update, setStatus, convert, reload: load };
}
