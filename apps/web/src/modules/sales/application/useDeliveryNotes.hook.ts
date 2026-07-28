import { useCallback, useEffect, useState } from "react";
import type { IDeliveryNoteRepository, DeliveryNote, DnInput, DeliverInput } from "@sales/domain/delivery-note.types";

export function useDeliveryNotes(repo: IDeliveryNoteRepository) {
  const [list, setList] = useState<DeliveryNote[]>([]);
  const load = useCallback(async () => { setList(await repo.list()); }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const create = useCallback(async (d: DnInput) => { const r = await repo.create(d); if (r.ok) await load(); return r; }, [repo, load]);
  const dispatch = useCallback(async (id: string) => { const r = await repo.dispatch(id); await load(); return r; }, [repo, load]);
  const deliver = useCallback(async (id: string, d: DeliverInput) => { const r = await repo.deliver(id, d); if (r.ok) await load(); return r; }, [repo, load]);
  const cancel = useCallback(async (id: string, reason: string) => { const r = await repo.cancel(id, reason); if (r.ok) await load(); return r; }, [repo, load]);
  const invoice = useCallback(async (id: string) => { const inv = await repo.invoiceFromDelivery(id); await load(); return inv; }, [repo, load]);
  return { list, create, dispatch, deliver, cancel, invoice, reload: load };
}
