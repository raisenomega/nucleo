import { useEffect, useState } from "react";
import type { IAppointmentSettingsRepository, AppointmentSettings, Result } from "@agenda/domain/appointment-settings.types";

const DEFAULT: AppointmentSettings = { timezone: "America/Puerto_Rico", bufferMinutes: 15, weeklySchedule: {} };

// Repo inyectado desde la sección (DI) — application no importa infrastructure.
export function useAppointmentSettings(repo: IAppointmentSettingsRepository, tenantId: string | null | undefined) {
  const [settings, setSettings] = useState<AppointmentSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void repo.get().then((s) => { if (s) setSettings(s); setLoading(false); }); }, []);
  async function save(s: AppointmentSettings): Promise<Result> {
    if (!tenantId) return { ok: false, error: "no-tenant" };
    const r = await repo.save(tenantId, s); if (r.ok) setSettings(s); return r;
  }
  return { settings, setSettings, loading, save };
}
