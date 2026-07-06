import { useState } from "react";
import { X, MessageCircle, MapPin } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import { StopPaymentForm } from "@operations/presentation/StopPaymentForm";
import { waLink, mapLink } from "@operations/presentation/stop-links";
import type { RouteStop, CompletePayload } from "@operations/domain/route.types";

const BADGE: Record<string, string> = { "Pendiente": "bg-yellow-100 text-yellow-800", "Completada": "bg-green-100 text-green-800", "No atendido": "bg-red-100 text-red-800" };

export function StopDetail({ stop, tenantId, onClose, onComplete, onNotAttended, onEvidence }: {
  stop: RouteStop; tenantId: string; onClose: () => void;
  onComplete: (p: CompletePayload) => void; onNotAttended: (r: string) => void; onEvidence: (paths: string[]) => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"" | "pay" | "reason">("");
  const [reason, setReason] = useState("");
  const done = stop.status === "Completada";
  const info = (l: string, v: string) => <div><span className="text-muted-foreground">{l}: </span>{v}</div>;
  const b = "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2"><h2 className="font-display text-lg font-bold text-primary">#{stop.stopOrder} {stop.clientName}</h2>
            <span className={`rounded px-2 py-0.5 text-xs font-bold ${BADGE[stop.status] ?? "bg-secondary"}`}>{stop.status}</span></div>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-0.5 text-sm">
          {stop.phone && <div><span className="text-muted-foreground">{t("phone")}: </span><a href={`tel:${stop.phone}`} className="text-primary">{stop.phone}</a></div>}
          {info(t("address"), `${stop.address}${stop.city ? ", " + stop.city : ""}`)}
          {info(t("serviceRequested"), stop.serviceType)}{info(t("date"), stop.scheduledTime.slice(0, 5))}
          {info(t("amount"), formatCurrency(stop.estimatedAmount))}
        </div>
        <div className="flex flex-wrap gap-2">
          {stop.phone && <a href={waLink(stop.phone, `${stop.clientName} - ${stop.serviceType}`)} target="_blank" rel="noreferrer" className={`${b} bg-green-600 text-white`}><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
          <a href={mapLink(stop.address, stop.city)} target="_blank" rel="noreferrer" className={`${b} bg-secondary`}><MapPin className="h-4 w-4" /> {t("openMap")}</a>
          {!done && <button type="button" onClick={() => setMode(mode === "pay" ? "" : "pay")} className={`${b} bg-primary text-primary-foreground`}>{t("collectPayment")}</button>}
          {!done && <button type="button" onClick={() => setMode(mode === "reason" ? "" : "reason")} className={`${b} bg-destructive text-primary-foreground`}>{t("notAttended")}</button>}
        </div>
        {mode === "pay" && <StopPaymentForm stop={stop} onSubmit={onComplete} />}
        {mode === "reason" && (
          <div className="space-y-2">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("reason")} className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
            <button type="button" onClick={() => onNotAttended(reason)} className="rounded-lg bg-destructive text-primary-foreground px-4 py-2 text-sm font-bold">{t("notAttended")}</button>
          </div>
        )}
        <div className="space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("addEvidence")}</span>
          <EvidenceUpload tenantId={tenantId} value={stop.evidenceUrls} onChange={onEvidence} /></div>
      </div>
    </div>
  );
}
