import { MessageCircle, MapPin, DollarSign, XCircle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { waLink, mapLink } from "@operations/presentation/stop-links";
import type { RouteStop } from "@operations/domain/route.types";

// Grid 2x2 de acciones grandes (min-h 56px). Solo Lucide, sin emojis.
export function StopActionsGrid({ stop, onPay, onNotAttended }: { stop: RouteStop; onPay: () => void; onNotAttended: () => void }) {
  const { t } = useI18n();
  const c = "flex min-h-[56px] items-center justify-center gap-2 rounded-xl border text-sm font-bold";
  return (
    <div className="grid grid-cols-2 gap-3">
      <a href={stop.phone ? waLink(stop.phone, `${stop.clientName} - ${stop.serviceType}`) : undefined} target="_blank" rel="noreferrer"
        className={`${c} border-green-200 bg-green-50 text-green-700`}><MessageCircle className="h-5 w-5" /> WhatsApp</a>
      <a href={mapLink(stop.address, stop.city)} target="_blank" rel="noreferrer"
        className={`${c} border-blue-200 bg-blue-50 text-blue-700`}><MapPin className="h-5 w-5" /> {t("openMap")}</a>
      <button type="button" onClick={onPay} className={`${c} border-primary/20 bg-primary/10 text-primary`}><DollarSign className="h-5 w-5" /> {t("collectPayment")}</button>
      <button type="button" onClick={onNotAttended} className={`${c} border-red-200 bg-red-50 text-red-700`}><XCircle className="h-5 w-5" /> {t("notAttended")}</button>
    </div>
  );
}
