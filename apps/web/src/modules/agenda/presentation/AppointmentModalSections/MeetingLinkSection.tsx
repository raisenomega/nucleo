import { useI18n } from "@shared/i18n";

export function MeetingLinkSection({ value, invalid, onChange }: { value: string; invalid: boolean; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border bg-background p-2 text-sm";
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{t("agendaMeetingLink")}</span>
      <input type="url" inputMode="url" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={t("agendaMeetingLinkPlaceholder")} className={`${fld} ${invalid ? "border-destructive" : "border-border"}`} />
      {invalid && <span className="mt-1 block text-xs text-destructive">{t("agendaMeetingLinkInvalid")}</span>}
    </label>
  );
}
