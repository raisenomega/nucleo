import { useI18n } from "@shared/i18n";
import { STATUSES, TEMPS } from "@crm/presentation/lead.constants";

export function TempBadge({ value }: { value: string }) {
  const { t } = useI18n();
  const tmp = TEMPS.find((x) => x.value === value);
  if (!tmp) return <span>{value}</span>;
  const Icon = tmp.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${tmp.color}`}>
      <Icon className="h-3 w-3" /> {t(tmp.key)}
    </span>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const { t } = useI18n();
  const st = STATUSES.find((x) => x.value === value);
  if (!st) return <span>{value}</span>;
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${st.color}`}>{t(st.key)}</span>;
}
