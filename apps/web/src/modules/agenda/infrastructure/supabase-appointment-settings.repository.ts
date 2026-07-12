import { supabase } from "@shared/lib/supabase";
import { toSettings, fromSettings, type SettingsRow } from "@agenda/infrastructure/appointment-settings.mapper";
import type { IAppointmentSettingsRepository, Result } from "@agenda/domain/appointment-settings.types";

const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });

export const supabaseAppointmentSettingsRepository: IAppointmentSettingsRepository = {
  async get() {
    const { data } = await supabase.from("appointment_settings").select("timezone,buffer_minutes,weekly_schedule").maybeSingle();
    return data ? toSettings(data as SettingsRow) : null;
  },
  async save(tenantId, s) {
    const { error } = await supabase.from("appointment_settings").upsert(fromSettings(tenantId, s), { onConflict: "tenant_id" });
    return ok(error);
  },
};
