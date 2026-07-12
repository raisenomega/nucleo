import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { useToast } from "@shared/providers/toast-context";
import { useAppointmentSettings } from "@agenda/application/useAppointmentSettings.hook";
import { supabaseAppointmentSettingsRepository } from "@agenda/infrastructure/supabase-appointment-settings.repository";
import { WeeklyScheduleEditor } from "@agenda/presentation/WeeklyScheduleEditor";

const TZ = ["America/Puerto_Rico", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"];

export function AvailabilitySection() {
  const { t } = useI18n();
  const { session } = useSession();
  const toast = useToast();
  const { settings, setSettings, save } = useAppointmentSettings(supabaseAppointmentSettingsRepository, session?.tenantId);
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "block text-sm"; const cap = "mb-1 block font-medium text-foreground";
  async function onSave() { const r = await save(settings); if (r.ok) toast.success(t("saved")); else toast.error(r.error); }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className={lbl}><span className={cap}>{t("agendaTimezone")}</span>
          <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className={fld}>{TZ.map((z) => <option key={z} value={z}>{z}</option>)}</select></label>
        <label className={lbl}><span className={cap}>{t("agendaBuffer")}</span>
          <input type="number" min={0} max={120} value={settings.bufferMinutes} onChange={(e) => setSettings({ ...settings, bufferMinutes: Number(e.target.value) })} className={`w-24 ${fld}`} /></label>
      </div>
      <WeeklyScheduleEditor value={settings.weeklySchedule} onChange={(v) => setSettings({ ...settings, weeklySchedule: v })} />
      <button type="button" onClick={() => void onSave()} className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground">{t("save")}</button>
    </div>
  );
}
