import { MessageCircle, MapPin, CheckCircle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { waLink, mapLink } from "@operations/presentation/stop-links";
import type { RouteStop } from "@operations/domain/route.types";

// Tarjeta de parada: datos + acciones rápidas. Click en la tarjeta -> abre el detalle.
export function StopCard({ stop, onOpen }: { stop: RouteStop; onOpen: (s: RouteStop) => void }) {
  const { t } = useI18n();
  const done = stop.status === "Completada";
  const debt = stop.status === "No atendido" && stop.pendingCollection;
  const msg = `${stop.clientName} - ${stop.serviceType} ${stop.scheduledTime.slice(0, 5)}`;
  const btn = "flex items-center gap-1 rounded px-2 py-1 text-xs font-bold";
  return (
    <div onClick={() => onOpen(stop)} className="cursor-pointer space-y-2 rounded-lg border border-border bg-card p-3 hover:bg-secondary">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{done ? "✅ " : debt ? "⚠️ " : ""}#{stop.stopOrder} {stop.clientName}</span>
        <span className="text-xs text-muted-foreground">{stop.scheduledTime.slice(0, 5)}</span>
      </div>
      <p className="text-xs text-muted-foreground">{stop.address}{stop.city ? `, ${stop.city}` : ""} · {stop.serviceType}</p>
      <p className={`text-xs font-bold ${debt ? "text-yellow-700" : ""}`}>{debt ? `${t("pendingDebt")}: ` : ""}{formatCurrency(stop.estimatedAmount)}</p>
      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        {stop.phone && <a href={waLink(stop.phone, msg)} target="_blank" rel="noreferrer" className={`${btn} bg-green-600 text-white`}><MessageCircle className="h-3 w-3" /> WhatsApp</a>}
        <a href={mapLink(stop.address, stop.city)} target="_blank" rel="noreferrer" className={`${btn} bg-secondary`}><MapPin className="h-3 w-3" /> {t("openMap")}</a>
        {!done && <button type="button" onClick={() => onOpen(stop)} className={`${btn} bg-primary text-primary-foreground`}><CheckCircle className="h-3 w-3" /> {t("completeStop")}</button>}
      </div>
    </div>
  );
}
