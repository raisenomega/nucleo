import { useI18n } from "@shared/i18n";

export function NotifyClientToggle({ checked, hasEmail, onChange }: { checked: boolean; hasEmail: boolean; onChange: (v: boolean) => void }) {
  const { t } = useI18n();
  return (
    <label className={`flex items-start gap-2 rounded-lg border border-border p-3 ${hasEmail ? "" : "opacity-60"}`}>
      <input type="checkbox" checked={checked && hasEmail} disabled={!hasEmail} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4" />
      <span className="text-sm">
        <span className="font-medium text-foreground">{t("agendaNotifyClient")}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{hasEmail ? t("agendaNotifyClientHint") : t("agendaNotifyNoEmail")}</span>
      </span>
    </label>
  );
}
