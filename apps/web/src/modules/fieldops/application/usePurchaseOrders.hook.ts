import { useCallback, useEffect, useState } from "react";
import type { PurchaseOrder, POCreateData, POStatus, IPurchaseOrderRepository } from "@fieldops/domain/purchase-order.types";

export function usePurchaseOrders(repo: IPurchaseOrderRepository) {
  const [items, setItems] = useState<PurchaseOrder[]>([]);
  const refresh = useCallback(async () => { const r = await repo.list(); setItems(r.ok ? r.value : []); }, [repo]);
  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (d: POCreateData) => { const r = await repo.create(d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const setStatus = useCallback(async (id: string, s: POStatus) => { const r = await repo.setStatus(id, s); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const receive = useCallback(async (id: string, its: { itemId: string; receivedQty: number }[]) => { const r = await repo.receive(id, its); if (r.ok) await refresh(); return r; }, [repo, refresh]);

  return { items, create, setStatus, receive, refresh };
}
