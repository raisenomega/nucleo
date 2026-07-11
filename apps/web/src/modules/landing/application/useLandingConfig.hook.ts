import { useCallback, useEffect, useState } from "react";
import { useSession } from "@shared/providers/SessionProvider";
import type { ILandingConfigRepository, LandingConfig, Result } from "@landing/domain/landing.types";

// Carga la config de landing del tenant + guarda (UPSERT). El repo se inyecta desde la ruta (DI).
export function useLandingConfig(repo: ILandingConfigRepository) {
  const { session } = useSession();
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { setConfig(await repo.get()); }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const save = useCallback(async (c: LandingConfig): Promise<Result> => {
    if (!session?.tenantId) return { ok: false, error: "no-tenant" };
    setSaving(true);
    const r = await repo.upsert(session.tenantId, c);
    setSaving(false);
    if (r.ok) await load();
    return r;
  }, [repo, session?.tenantId, load]);
  return { config, saving, save, reload: load };
}
