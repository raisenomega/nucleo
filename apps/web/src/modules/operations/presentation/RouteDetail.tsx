import { useState } from "react";
import { X, FileDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdf } from "@shared/hooks/usePdf";
import { ScreenModal } from "@shared/components/ScreenModal";
import { StopCard } from "@operations/presentation/StopCard";
import { StopDetail } from "@operations/presentation/StopDetail";
import type { ServiceRoute, RouteStop, CompletePayload } from "@operations/domain/route.types";

type Emp = { id: string; full_name: string };

export function RouteDetail({ route, stops, employees, tenantId, onClose, onPay, onNotAttended, onEvidence, onMarkDone }: {
  route: ServiceRoute; stops: readonly RouteStop[]; employees: Emp[]; tenantId: string; onClose: () => void;
  onPay: (id: string, p: CompletePayload) => void; onNotAttended: (id: string, r: string) => void;
  onEvidence: (id: string, paths: string[]) => void; onMarkDone: (id: string) => void;
}) {
  const { t } = useI18n();
  const pdf = usePdf();
  const [open, setOpen] = useState<RouteStop | null>(null);
  const emp = employees.find((e) => e.id === route.assignedTo)?.full_name ?? "—";
  const cur = open ? (stops.find((s) => s.id === open.id) ?? open) : null;
  return (
    <>
      <ScreenModal onClose={onClose}>
        <div className="flex items-start justify-between border-b border-border p-4">
          <div><h2 className="font-display text-lg font-bold text-foreground">{route.routeDate} · {emp}</h2>
            <p className="text-xs text-muted-foreground">{route.status} · {route.completedCount}/{route.stopCount} {t("stopsCompleted")}</p></div>
          <div className="flex items-center gap-3">
            <button type="button" disabled={pdf.generating} onClick={() => void pdf.generatePdf("route", route.id)} aria-label={t("routePdf")} className="text-muted-foreground hover:text-foreground disabled:opacity-50"><FileDown className="h-5 w-5" /></button>
            <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button></div>
        </div>
        <div className="space-y-2 p-4">
          {stops.length === 0 && <p className="text-xs text-muted-foreground">{t("noRecords")}</p>}
          {stops.map((s) => <StopCard key={s.id} stop={s} onOpen={setOpen} />)}
        </div>
      </ScreenModal>
      {cur && <StopDetail stop={cur} tenantId={tenantId} onClose={() => setOpen(null)}
        onPay={(p) => onPay(cur.id, p)}
        onNotAttended={(r) => { onNotAttended(cur.id, r); setOpen(null); }}
        onMarkDone={() => { onMarkDone(cur.id); setOpen(null); }}
        onEvidence={(paths) => onEvidence(cur.id, paths)} />}
    </>
  );
}
