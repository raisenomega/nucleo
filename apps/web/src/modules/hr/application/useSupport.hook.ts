import { useCallback, useEffect, useState } from "react";
import type { ISupportRepository, Ticket, TicketInput, TicketStatus, SupportSummary } from "@hr/domain/support.types";

const EMPTY: SupportSummary = { open: 0, in_progress: 0, resolved: 0, closed: 0 };

export function useSupport(repo: ISupportRepository) {
  const [list, setList] = useState<Ticket[]>([]);
  const [summary, setSummary] = useState<SupportSummary>(EMPTY);
  const load = useCallback(async () => {
    const [l, s] = await Promise.all([repo.list(), repo.summary()]);
    setList(l); setSummary(s);
  }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const create = useCallback(async (t: TicketInput) => { const r = await repo.create(t); if (r.ok) await load(); return r; }, [repo, load]);
  const setStatus = useCallback(async (id: string, st: TicketStatus) => { const r = await repo.setStatus(id, st); if (r.ok) await load(); return r; }, [repo, load]);
  const assign = useCallback(async (id: string, to: string | null) => { const r = await repo.assign(id, to); if (r.ok) await load(); return r; }, [repo, load]);
  return { list, summary, create, setStatus, assign, detail: repo.detail, addComment: repo.addComment };
}
