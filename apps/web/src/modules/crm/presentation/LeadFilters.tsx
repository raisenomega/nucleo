import { useI18n } from "@shared/i18n";
import { STATUSES, TEMPS } from "@crm/presentation/lead.constants";

export function LeadFilters({ temp, status, onTemp, onStatus, counts }: {
  temp: string; status: string; onTemp: (v: string) => void; onStatus: (v: string) => void;
  counts: { total: number; hot: number; warm: number; cold: number };
}) {
  const { t } = useI18n();
  const sel = "rounded-lg border border-border bg-background p-2 font-body text-sm";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select value={temp} onChange={(e) => onTemp(e.target.value)} className={sel}>
        <option value="">{t("temperature")}</option>
        {TEMPS.map((x) => <option key={x.value} value={x.value}>{t(x.key)}</option>)}
      </select>
      <select value={status} onChange={(e) => onStatus(e.target.value)} className={sel}>
        <option value="">{t("status")}</option>
        {STATUSES.map((x) => <option key={x.value} value={x.value}>{t(x.key)}</option>)}
      </select>
      <div className="flex-1" />
      <div className="font-body text-sm text-muted-foreground">
        {t("total")}: <b className="text-foreground">{counts.total}</b>
        {" · "}<b className="text-red-600">{counts.hot}</b>
        {" · "}<b className="text-orange-600">{counts.warm}</b>
        {" · "}<b className="text-blue-600">{counts.cold}</b>
      </div>
    </div>
  );
}
