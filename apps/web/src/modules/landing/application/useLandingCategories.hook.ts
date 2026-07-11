import { useCallback, useEffect, useState } from "react";
import { useSession } from "@shared/providers/SessionProvider";
import type { ILandingCategoriesRepository, LandingCategory, CategoryInput, Result } from "@landing/domain/landing.types";

// CRUD de categorías de landing. Repo inyectado desde la ruta (DI).
export function useLandingCategories(repo: ILandingCategoriesRepository) {
  const { session } = useSession();
  const [list, setList] = useState<LandingCategory[]>([]);
  const load = useCallback(async () => { setList(await repo.list()); }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const create = useCallback(async (input: CategoryInput): Promise<Result> => {
    if (!session?.tenantId) return { ok: false, error: "no-tenant" };
    const r = await repo.create(session.tenantId, input); if (r.ok) await load(); return r;
  }, [repo, session?.tenantId, load]);
  const update = useCallback(async (id: string, input: CategoryInput): Promise<Result> => {
    const r = await repo.update(id, input); if (r.ok) await load(); return r;
  }, [repo, load]);
  const remove = useCallback(async (id: string): Promise<Result> => {
    const r = await repo.remove(id); if (r.ok) await load(); return r;
  }, [repo, load]);
  return { list, create, update, remove, reload: load };
}
