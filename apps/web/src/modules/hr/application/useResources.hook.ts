import { useCallback, useEffect, useState } from "react";
import type { IResourceRepository, Resource, ResourceInput } from "@hr/domain/resource.types";

export function useResources(repo: IResourceRepository) {
  const [library, setLibrary] = useState<Resource[]>([]);
  const load = useCallback(async () => { setLibrary(await repo.library()); }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const create = useCallback(async (i: ResourceInput) => { const r = await repo.create(i); if (r.ok) await load(); return r; }, [repo, load]);
  const update = useCallback(async (id: string, i: Partial<ResourceInput>) => { const r = await repo.update(id, i); if (r.ok) await load(); return r; }, [repo, load]);
  const remove = useCallback(async (id: string) => { const r = await repo.remove(id); if (r.ok) await load(); return r; }, [repo, load]);
  return { library, reload: load, create, update, remove, repo };
}
