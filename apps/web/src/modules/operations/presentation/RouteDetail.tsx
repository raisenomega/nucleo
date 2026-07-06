import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { StopCard } from "@operations/presentation/StopCard";
import { StopDetail } from "@operations/presentation/StopDetail";
import type { ServiceRoute, RouteStop, CompletePayload } from "@operations/domain/route.types";

type Emp = { id: string; full_name: string };

export function RouteDetail({ route, stops, employees, tenantId, onClose, onEdit, onDuplicate, onArchive, onComplete, onNotAttended, onEvidence }: {
  route: ServiceRoute; stops: readonly RouteStop[]; employees: Emp[]; tenantId: string; onClose: () => void;
  onEdit?: () => void; onDuplicate?: () => void; onArchive?: () => void;
  onComplete: (id: string, p: CompletePayload) => void; onNotAttended: (id: string, r: string) => void; onEvidence: (id: string, paths: string[]) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState<RouteStop | null>(null);
  const emp = employees.find((e) => e.id === route.assignedTo)?.full_name ?? "—";
  const cur = open ? (stops.find((s) => s.id === open.id) ?? open) : null;
  const b = "rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold";
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-primary">{route.routeDate} · {emp}</h2>
            <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-5 w-5" /></button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{route.status}{route.notes ? ` · ${route.notes}` : ""}</p>
            <span className="text-xs font-bold">{route.completedCount}/{route.stopCount} {t("stopsCompleted")}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {onEdit && <button type="button" onClick={onEdit} className={b}>{t("edit")}</button>}
            {onDuplicate && <button type="button" onClick={onDuplicate} className={b}>{t("duplicate")}</button>}
            {onArchive && <button type="button" onClick={onArchive} className={b}>{t("archive")}</button>}
          </div>
          <div className="space-y-2">
            {stops.length === 0 && <p className="text-xs text-muted-foreground">{t("noRecords")}</p>}
            {stops.map((s) => <StopCard key={s.id} stop={s} onOpen={setOpen} />)}
          </div>
        </div>
      </div>
      {cur && <StopDetail stop={cur} tenantId={tenantId} onClose={() => setOpen(null)}
        onComplete={(p) => { onComplete(cur.id, p); setOpen(null); }}
        onNotAttended={(r) => { onNotAttended(cur.id, r); setOpen(null); }}
        onEvidence={(paths) => onEvidence(cur.id, paths)} />}
    </>
  );
}
