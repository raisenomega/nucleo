import { useCallback, useEffect, useState } from "react";
import { Navigation, Phone, Check, MapPin, Truck } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { getMyRouteToday, type DriverRoute } from "@operations/infrastructure/driver.repository";
import { supabaseRouteRepository } from "@operations/infrastructure/supabase-route.repository";
import { DriverStopList } from "@operations/presentation/DriverStopList";

const isDone = (s: string) => s.startsWith("Completad");
const gmaps = (a: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;

// Driver-view mobile-first: "mi ruta de hoy" con siguiente parada prominente + lista. Botones grandes touch.
export function DriverView() {
  const { t } = useI18n();
  const { session } = useSession();
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => { void getMyRouteToday(session?.userId ?? "").then((r) => { setRoute(r); setLoading(false); }); }, [session?.userId]);
  useEffect(load, [load]);
  if (loading) return <p className="p-8 text-center text-sm text-muted-foreground">…</p>;
  if (!route) return <div className="p-10 text-center"><Truck className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 font-bold text-foreground">{t("noRouteToday")}</p></div>;
  const done = route.stops.filter((s) => isDone(s.status)).length;
  const pct = route.stops.length ? Math.round((done / route.stops.length) * 100) : 0;
  const next = route.stops.find((s) => !isDone(s.status));
  const complete = async (id: string) => { await supabaseRouteRepository.completeStop(id); load(); };
  const act = "flex items-center justify-center gap-1 rounded-lg py-3 text-sm font-bold";
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("myRoute")} · {route.date}</p>
        {route.assetName && <p className="flex items-center gap-1.5 font-bold text-foreground"><Truck className="h-4 w-4" />{route.assetName}</p>}
        <p className="mt-1 text-sm font-bold text-foreground">{done}/{route.stops.length} · {pct}%</p>
        <div className="mt-1 h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
      </div>
      {next && (
        <div className="space-y-3 rounded-xl border-2 border-primary bg-card p-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">{t("nextStop")}</p>
            <p className="flex items-start gap-1.5 text-lg font-bold text-foreground"><MapPin className="mt-1 h-5 w-5 shrink-0" />{next.address || "—"}</p>
            {(next.clientName || next.serviceType) && <p className="text-sm text-muted-foreground">{[next.clientName, next.serviceType].filter(Boolean).join(" · ")}</p>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <a href={gmaps(next.address)} target="_blank" rel="noopener noreferrer" className={`${act} bg-secondary text-foreground`}><Navigation className="h-4 w-4" />{t("openMap")}</a>
            <a href={next.phone ? `tel:${next.phone}` : undefined} className={`${act} bg-secondary text-foreground ${next.phone ? "" : "pointer-events-none opacity-40"}`}><Phone className="h-4 w-4" />{t("callClient")}</a>
            <button type="button" onClick={() => void complete(next.id)} className={`${act} bg-primary text-primary-foreground`}><Check className="h-4 w-4" />{t("completeStop")}</button>
          </div>
        </div>
      )}
      <DriverStopList stops={route.stops} nextId={next?.id} />
    </div>
  );
}
