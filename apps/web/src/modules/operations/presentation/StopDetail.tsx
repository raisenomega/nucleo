import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { StopEvidencePhase } from "@operations/presentation/StopEvidencePhase";
import { StopClientSection } from "@operations/presentation/StopClientSection";
import { StopActionsGrid } from "@operations/presentation/StopActionsGrid";
import { StopPaymentForm } from "@operations/presentation/StopPaymentForm";
import { StopSuppliesForm } from "@operations/presentation/StopSuppliesForm";
import type { RouteStop, CompletePayload } from "@operations/domain/route.types";

export function StopDetail({ stop, tenantId, onClose, onPay, onNotAttended, onEvidence, onMarkDone }: {
  stop: RouteStop; tenantId: string; onClose: () => void; onMarkDone: () => void;
  onPay: (p: CompletePayload) => void; onNotAttended: (r: string) => void; onEvidence: (phase: "before" | "after", paths: string[]) => void;
}) {
  const { t } = useI18n();
  const canComplete = stop.evidenceBefore.length >= 1 && stop.evidenceAfter.length >= 1;
  const [mode, setMode] = useState<"" | "reason">("");
  const [reason, setReason] = useState("");
  const [paying, setPaying] = useState(false);
  const [supplies, setSupplies] = useState(false);
  const done = stop.status === "Completada";
  const debt = stop.status === "No atendido" && stop.pendingCollection;
  return (
    <>
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("stopDetail")} #{stop.stopOrder} — {stop.clientName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        <StopClientSection stop={stop} />
        {!done && <StopActionsGrid stop={stop} onPay={() => setPaying(true)} onSupplies={() => setSupplies(true)} onNotAttended={() => setMode(mode === "reason" ? "" : "reason")} />}
        {mode === "reason" && (
          <div className="space-y-2">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("reason")} className="h-12 w-full rounded-lg border border-border bg-background p-3" />
            <button type="button" onClick={() => onNotAttended(reason)} className="h-12 w-full rounded-lg bg-red-600 font-bold text-white">{t("notAttended")}</button>
          </div>
        )}
        <div className="space-y-1"><span className="text-xs font-bold text-muted-foreground">📸 {t("evidenceBefore")}</span>
          <StopEvidencePhase tenantId={tenantId} routeId={stop.routeId} stopId={stop.id} phase="before" value={stop.evidenceBefore} onChange={(p) => onEvidence("before", p)} /></div>
        <div className="space-y-1"><span className="text-xs font-bold text-muted-foreground">📸 {t("evidenceAfter")}</span>
          <StopEvidencePhase tenantId={tenantId} routeId={stop.routeId} stopId={stop.id} phase="after" value={stop.evidenceAfter} onChange={(p) => onEvidence("after", p)} /></div>
        {done ? <div className="rounded-lg bg-green-50 dark:bg-green-500/15 p-3 text-center font-bold text-green-700 dark:text-green-300">{t("stopCompleted")}: {formatCurrency(stop.actualAmount ?? stop.estimatedAmount)}</div>
          : debt ? <div className="rounded-lg bg-yellow-50 dark:bg-yellow-500/15 p-3 text-center font-bold text-yellow-700 dark:text-yellow-300">{t("pendingDebt")}: {formatCurrency(stop.estimatedAmount)}</div>
          : <div className="space-y-1">
              <button type="button" disabled={!canComplete} onClick={onMarkDone} title={canComplete ? "" : t("evidenceRequired")} className="w-full rounded-lg bg-green-600 p-3 text-center font-bold text-white disabled:opacity-50">{t("completeStop")}</button>
              {!canComplete && <p className="text-center text-xs text-muted-foreground">{t("evidenceRequired")}</p>}
            </div>}
      </div>
    </ScreenModal>
    {paying && <StopPaymentForm stop={stop} onClose={() => setPaying(false)} onSubmit={(p) => { onPay(p); setPaying(false); }} />}
    {supplies && <StopSuppliesForm stopId={stop.id} onClose={() => setSupplies(false)} />}
    </>
  );
}
