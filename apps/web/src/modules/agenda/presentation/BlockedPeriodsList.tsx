import { useI18n } from "@shared/i18n";
import type { BlockedPeriod } from "@agenda/domain/blocked-period.types";

const fmt = (s: string) => new Date(s).toLocaleString();

export function BlockedPeriodsList({ list, onDelete }: { list: BlockedPeriod[]; onDelete: (id: string) => void }) {
  const { t } = useI18n();
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {list.map((b) => (
        <li key={b.id} className="flex items-center gap-3 p-3 text-sm">
          <span className="flex-1"><span className="font-medium">{b.reason || "—"}</span> · {fmt(b.startsAt)} → {fmt(b.endsAt)}
            {b.isFullDay && <span className="ml-2 rounded bg-secondary px-2 py-0.5 text-xs">{t("agendaAllDay")}</span>}</span>
          <button type="button" onClick={() => onDelete(b.id)} className="text-destructive">{t("delete")}</button>
        </li>))}
      {list.length === 0 && <li className="p-3 text-sm text-muted-foreground">{t("agendaNoBlocks")}</li>}
    </ul>
  );
}
