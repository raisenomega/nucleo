import { useCallback, useEffect, useState } from "react";
import { useSession } from "@shared/providers/SessionProvider";
import type { Result } from "@landing/domain/landing.types";
import type { ILandingPackagesRepository, LandingPackage, PackageInput } from "@landing/domain/landing-package.types";

// CRUD de paquetes de landing. Repo inyectado desde la ruta (DI).
export function useLandingPackages(repo: ILandingPackagesRepository) {
  const { session } = useSession();
  const [list, setList] = useState<LandingPackage[]>([]);
  const load = useCallback(async () => { setList(await repo.list()); }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const create = useCallback(async (input: PackageInput): Promise<Result> => {
    if (!session?.tenantId) return { ok: false, error: "no-tenant" };
    const r = await repo.create(session.tenantId, input); if (r.ok) await load(); return r;
  }, [repo, session?.tenantId, load]);
  const update = useCallback(async (id: string, input: PackageInput): Promise<Result> => {
    const r = await repo.update(id, input); if (r.ok) await load(); return r;
  }, [repo, load]);
  const remove = useCallback(async (id: string): Promise<Result> => {
    const r = await repo.remove(id); if (r.ok) await load(); return r;
  }, [repo, load]);
  return { list, create, update, remove, reload: load };
}
