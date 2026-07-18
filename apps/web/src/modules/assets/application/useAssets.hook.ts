import { useCallback, useEffect, useState } from "react";
import type { Asset, AssetFormData, MaintenanceFormData, CheckoutData, CheckinData, IAssetRepository } from "@assets/domain/asset.types";

// Recibe el repositorio por inyección (DI) — NO importa infrastructure.
export function useAssets(repo: IAssetRepository) {
  const [items, setItems] = useState<Asset[]>([]);
  const refresh = useCallback(async () => { const r = await repo.list(); setItems(r.ok ? r.value : []); }, [repo]);
  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (d: AssetFormData) => { const r = await repo.create(d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const update = useCallback(async (id: string, d: AssetFormData) => { const r = await repo.update(id, d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const remove = useCallback(async (id: string) => { const r = await repo.remove(id); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const addMaintenance = useCallback(async (id: string, d: MaintenanceFormData) => { const r = await repo.addMaintenance(id, d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const checkout = useCallback(async (id: string, d: CheckoutData) => { const r = await repo.checkout(id, d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const checkin = useCallback(async (id: string, d: CheckinData) => { const r = await repo.checkin(id, d); if (r.ok) await refresh(); return r; }, [repo, refresh]);

  return { items, create, update, remove, addMaintenance, checkout, checkin, refresh };
}
