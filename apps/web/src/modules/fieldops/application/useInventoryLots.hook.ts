import { useCallback, useEffect, useState } from "react";
import type { InventoryLot, LotStatus, IInventoryLotRepository } from "@fieldops/domain/inventory-lot.types";

// DI. Expone: lotes de un ítem (loadByItem) + lotes por vencer (30d) + cambiar estado + expirar vencidos.
export function useInventoryLots(repo: IInventoryLotRepository) {
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [expiringLots, setExpiringLots] = useState<InventoryLot[]>([]);

  const refreshExpiring = useCallback(async () => { setExpiringLots(await repo.listExpiring(30)); }, [repo]);
  useEffect(() => { void refreshExpiring(); }, [refreshExpiring]);

  const loadByItem = useCallback(async (itemId: string) => { setLots(await repo.listByItem(itemId)); }, [repo]);
  const updateStatus = useCallback(async (id: string, status: LotStatus, itemId: string) => {
    const r = await repo.updateStatus(id, status);
    if (r.ok) { await loadByItem(itemId); await refreshExpiring(); }
    return r;
  }, [repo, loadByItem, refreshExpiring]);
  const expireAll = useCallback(async () => { await repo.expireAll(); await refreshExpiring(); }, [repo, refreshExpiring]);

  return { lots, expiringLots, loadByItem, updateStatus, expireAll, refreshExpiring };
}
