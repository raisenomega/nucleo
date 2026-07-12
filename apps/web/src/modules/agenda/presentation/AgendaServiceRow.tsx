import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import type { ReservableService } from "@agenda/domain/reservable-service.types";

const TYPES: [string, TranslationKey][] = [["none", "agendaReserveNone"], ["free", "agendaReserveFree"], ["deposit", "agendaReserveDeposit"], ["full", "agendaReserveFull"]];

export function AgendaServiceRow({ svc, onChange }: { svc: ReservableService; onChange: (rt: string, rp: number | null) => void }) {
  const { t } = useI18n();
  const fld = "rounded border border-border bg-background p-1 text-sm";
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border py-2 text-sm">
      <span className="flex-1 font-medium text-foreground">{svc.name}</span>
      {svc.durationMinutes != null && <span className="text-xs text-muted-foreground">{svc.durationMinutes} min</span>}
      <select value={svc.reserveType} onChange={(e) => onChange(e.target.value, svc.reservePrice)} className={fld}>
        {TYPES.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
      </select>
      {svc.reserveType === "deposit" && <input type="number" min={0} value={svc.reservePrice ?? ""} onChange={(e) => onChange("deposit", e.target.value ? Number(e.target.value) : null)} className={`w-24 ${fld}`} placeholder="$" />}
    </div>
  );
}
