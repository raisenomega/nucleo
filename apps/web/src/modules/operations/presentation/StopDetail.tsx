import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import { StopClientSection } from "@operations/presentation/StopClientSection";
import { StopActionsGrid } from "@operations/presentation/StopActionsGrid";
import { StopPaymentForm } from "@operations/presentation/StopPaymentForm";
import type { RouteStop, CompletePayload } from "@operations/domain/route.types";

export function StopDetail({ stop, tenantId, onClose, onComplete, onNotAttended, onEvidence }: {
  stop: RouteStop; tenantId: string; onClose: () => void;
  onComplete: (p: CompletePayload) => void; onNotAttended: (r: string) => void; onEvidence: (paths: string[]) => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"" | "reason">("");
  const [reason, setReason] = useState("");
  const [paying, setPaying] = useState(false);
  const done = stop.status === "Completada";
  const debt = stop.status === "No atendido" && stop.pendingCollection;
  return (
    <>
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-primary">{t("stopDetail")} #{stop.stopOrder} — {stop.clientName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        <StopClientSection stop={stop} />
        {!done && <StopActionsGrid stop={stop} onPay={() => setPaying(true)} onNotAttended={() => setMode(mode === "reason" ? "" : "reason")} />}
        {mode === "reason" && (
          <div className="space-y-2">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("reason")} className="h-12 w-full rounded-lg border border-border bg-background p-3" />
            <button type="button" onClick={() => onNotAttended(reason)} className="h-12 w-full rounded-lg bg-red-600 font-bold text-white">{t("notAttended")}</button>
          </div>
        )}
        <div className="space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("addEvidence")}</span>
          <EvidenceUpload tenantId={tenantId} value={stop.evidenceUrls} onChange={onEvidence} /></div>
        <div className={`rounded-lg p-3 text-center font-bold ${done ? "bg-green-50 text-green-700" : debt ? "bg-yellow-50 text-yellow-700" : "bg-secondary"}`}>
          {done ? `${t("stopCompleted")}: ${formatCurrency(stop.actualAmount ?? stop.estimatedAmount)}`
            : debt ? `${t("pendingDebt")}: ${formatCurrency(stop.estimatedAmount)}` : stop.status}
        </div>
      </div>
    </ScreenModal>
    {paying && <StopPaymentForm stop={stop} onClose={() => setPaying(false)} onSubmit={onComplete} />}
    </>
  );
}
