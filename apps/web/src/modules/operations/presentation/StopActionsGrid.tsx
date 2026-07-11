import { MessageCircle, MapPin, DollarSign, XCircle, Boxes } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { waLink, mapLink } from "@operations/presentation/stop-links";
import type { RouteStop } from "@operations/domain/route.types";

// Grid de acciones grandes (min-h 56px). Solo Lucide, sin emojis.
export function StopActionsGrid({ stop, onPay, onNotAttended, onSupplies }: {
  stop: RouteStop; onPay: () => void; onNotAttended: () => void; onSupplies: () => void;
}) {
  const { t } = useI18n();
  const c = "flex min-h-[56px] items-center justify-center gap-2 rounded-xl border text-sm font-bold";
  return (
    <div className="grid grid-cols-2 gap-3">
      {stop.phone
        ? <a href={waLink(stop.phone, `${stop.clientName} - ${stop.serviceType}`)} target="_blank" rel="noreferrer"
            className={`${c} border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-300`}><MessageCircle className="h-5 w-5" /> WhatsApp</a>
        : <span className={`${c} cursor-not-allowed border-border bg-secondary text-muted-foreground opacity-60`} title={t("noPhone")}><MessageCircle className="h-5 w-5" /> WhatsApp</span>}
      <a href={mapLink(stop.address, stop.city)} target="_blank" rel="noreferrer"
        className={`${c} border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300`}><MapPin className="h-5 w-5" /> {t("openMap")}</a>
      <button type="button" onClick={onPay} className={`${c} border-primary/20 bg-primary/10 text-foreground`}><DollarSign className="h-5 w-5" /> {t("collectPayment")}</button>
      <button type="button" onClick={onNotAttended} className={`${c} border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300`}><XCircle className="h-5 w-5" /> {t("notAttended")}</button>
      <button type="button" onClick={onSupplies} className={`${c} col-span-2 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300`}><Boxes className="h-5 w-5" /> {t("supplies")}</button>
    </div>
  );
}
