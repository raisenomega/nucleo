import { useCallback, useEffect, useState } from "react";
import type { ISalesOrderRepository, SalesOrder, SoInput } from "@sales/domain/sales-order.types";

export function useSalesOrders(repo: ISalesOrderRepository) {
  const [list, setList] = useState<SalesOrder[]>([]);
  const load = useCallback(async () => { setList(await repo.list()); }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const create = useCallback(async (d: SoInput) => { const r = await repo.create(d); if (r.ok) await load(); return r; }, [repo, load]);
  const update = useCallback(async (id: string, d: SoInput) => { const r = await repo.update(id, d); if (r.ok) await load(); return r; }, [repo, load]);
  const confirm = useCallback(async (id: string) => { const r = await repo.confirm(id); await load(); return r; }, [repo, load]);
  const cancel = useCallback(async (id: string, reason: string) => { const r = await repo.cancel(id, reason); if (r.ok) await load(); return r; }, [repo, load]);
  const createFromQuote = useCallback(async (qid: string) => { const id = await repo.createFromQuote(qid); await load(); return id; }, [repo, load]);
  const invoice = useCallback(async (id: string) => { const inv = await repo.invoiceFromOrder(id); await load(); return inv; }, [repo, load]);
  return { list, create, update, confirm, cancel, createFromQuote, invoice, reload: load };
}
