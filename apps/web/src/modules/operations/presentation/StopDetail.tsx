import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import { StopClientSection } from "@operations/presentation/StopClientSection";
import { StopActionsGrid } from "@operations/presentation/StopActionsGrid";
import { StopPaymentForm } from "@operations/presentation/StopPaymentForm";
import { StopSuppliesForm } from "@operations/presentation/StopSuppliesForm";
import type { RouteStop, CompletePayload } from "@operations/domain/route.types";

export function StopDetail({ stop, tenantId, onClose, onPay, onNotAttended, onEvidence, onMarkDone }: {
  stop: RouteStop; tenantId: string; onClose: () => void; onMarkDone: () => void;
  onPay: (p: CompletePayload) => void; onNotAttended: (r: string) => void; onEvidence: (paths: string[]) => void;
}) {
  const { t } = useI18n();
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
        <h2 className="font-display text-lg font-bold text-primary">{t("stopDetail")} #{stop.stopOrder} — {stop.clientName}</h2>
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
        <div className="space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("addEvidence")}</span>
          <EvidenceUpload tenantId={tenantId} value={stop.evidenceUrls} onChange={onEvidence} /></div>
        {done ? <div className="rounded-lg bg-green-50 dark:bg-green-500/15 p-3 text-center font-bold text-green-700 dark:text-green-300">{t("stopCompleted")}: {formatCurrency(stop.actualAmount ?? stop.estimatedAmount)}</div>
          : debt ? <div className="rounded-lg bg-yellow-50 dark:bg-yellow-500/15 p-3 text-center font-bold text-yellow-700 dark:text-yellow-300">{t("pendingDebt")}: {formatCurrency(stop.estimatedAmount)}</div>
          : <button type="button" onClick={onMarkDone} className="w-full rounded-lg bg-green-600 p-3 text-center font-bold text-white">{t("completeStop")}</button>}
      </div>
    </ScreenModal>
    {paying && <StopPaymentForm stop={stop} onClose={() => setPaying(false)} onSubmit={(p) => { onPay(p); setPaying(false); }} />}
    {supplies && <StopSuppliesForm stopId={stop.id} onClose={() => setSupplies(false)} />}
    </>
  );
}
