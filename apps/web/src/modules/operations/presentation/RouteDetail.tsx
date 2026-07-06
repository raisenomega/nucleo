import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { ServiceRoute, RouteStop } from "@operations/domain/route.types";

type Emp = { id: string; full_name: string };

export function RouteDetail({ route, stops, employees, onClose, onEdit, onDuplicate, onArchive }: {
  route: ServiceRoute; stops: readonly RouteStop[]; employees: Emp[]; onClose: () => void;
  onEdit?: () => void; onDuplicate?: () => void; onArchive?: () => void;
}) {
  const { t } = useI18n();
  const emp = employees.find((e) => e.id === route.assignedTo)?.full_name ?? "—";
  const b = "rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-primary">{route.routeDate} · {emp}</h2>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-5 w-5" /></button>
        </div>
        <p className="text-xs text-muted-foreground">{t("status")}: {route.status}{route.notes ? ` · ${route.notes}` : ""}</p>
        <div className="flex flex-wrap gap-2">
          {onEdit && <button type="button" onClick={onEdit} className={b}>{t("edit")}</button>}
          {onDuplicate && <button type="button" onClick={onDuplicate} className={b}>{t("duplicate")}</button>}
          {onArchive && <button type="button" onClick={onArchive} className={b}>{t("archive")}</button>}
        </div>
        <div className="grid h-28 place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">🗺️ {t("comingSoon")}</div>
        <div className="space-y-2">
          {stops.length === 0 && <p className="text-xs text-muted-foreground">{t("noRecords")}</p>}
          {stops.map((s) => (
            <div key={s.id} className="rounded-lg border border-border p-2 text-sm">
              <div className="flex justify-between"><span className="font-semibold">#{s.stopOrder} {s.clientName}</span>
                <span className="text-muted-foreground">{s.scheduledTime.slice(0, 5)}</span></div>
              <p className="text-xs text-muted-foreground">{s.address}{s.city ? `, ${s.city}` : ""} · {s.serviceType}</p>
              <p className="text-xs">{formatCurrency(s.estimatedAmount)} · {s.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
