import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { RouteStop } from "@operations/domain/route.types";

// Tarjeta compacta de parada. Click -> abre el detalle (pantalla completa en mobile).
export function StopCard({ stop, onOpen }: { stop: RouteStop; onOpen: (s: RouteStop) => void }) {
  const { t } = useI18n();
  const done = stop.status === "Completada";
  const debt = stop.status === "No atendido" && stop.pendingCollection;
  const badge = done ? "bg-green-100 text-green-800" : debt ? "bg-yellow-100 text-yellow-800" : "bg-secondary";
  return (
    <button type="button" onClick={() => onOpen(stop)} className="w-full space-y-1 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-secondary">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">#{stop.stopOrder} {stop.clientName}</span>
        <span className={`rounded px-2 py-0.5 text-xs font-bold ${badge}`}>{stop.status}</span>
      </div>
      <p className="text-xs text-muted-foreground">{stop.address}{stop.city ? `, ${stop.city}` : ""} · {stop.serviceType} · {stop.scheduledTime.slice(0, 5)}</p>
      {stop.phone && <p className="text-xs text-muted-foreground">{t("phone")}: {stop.phone}</p>}
      <p className={`text-sm font-bold ${debt ? "text-yellow-700" : "text-primary"}`}>{debt ? `${t("pendingDebt")}: ` : ""}{formatCurrency(stop.estimatedAmount)}</p>
    </button>
  );
}
