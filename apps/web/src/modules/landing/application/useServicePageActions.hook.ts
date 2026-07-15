import { useState } from "react";
import type { IServicePagesRepository, ServicePageAdmin } from "@landing/domain/service-page-admin.types";

// Mutaciones CRUD de páginas de servicio. Devuelve el id nuevo en create/duplicate.
export function useServicePageActions(repo: IServicePagesRepository) {
  const [busy, setBusy] = useState(false);
  const run = async <T,>(fn: () => Promise<T>): Promise<T> => { setBusy(true); try { return await fn(); } finally { setBusy(false); } };
  return {
    busy,
    create: (tenantId: string, slug: string, titleEs: string, titleEn: string, subtitleEs: string) =>
      run(() => repo.create(tenantId, slug, titleEs, titleEn, subtitleEs)),
    save: (id: string, page: ServicePageAdmin) => run(() => repo.save(id, page)),
    duplicate: (tenantId: string, id: string) => run(() => repo.duplicate(tenantId, id)),
    remove: (id: string) => run(() => repo.remove(id)),
    toggleActive: (id: string, active: boolean) => run(() => repo.toggleActive(id, active)),
  };
}
