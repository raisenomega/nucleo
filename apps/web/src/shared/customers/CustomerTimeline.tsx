import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, DollarSign, FileCheck, ShoppingBag, MapPin, UserPlus, Star, UserCheck } from "lucide-react";
import { getCustomerTimeline, type TimelineEvent } from "@shared/customers/customer-timeline.repository";
import { TimelineFilters } from "@shared/customers/TimelineFilters";

// Feed cronológico unificado de la actividad del cliente. Cada evento linkea a su entidad (factura/cotización/orden…).
const META: Record<string, { Icon: typeof FileText; cls: string }> = {
  invoice: { Icon: FileText, cls: "bg-blue-500/10 text-blue-600" }, payment: { Icon: DollarSign, cls: "bg-green-500/10 text-green-600" },
  quote: { Icon: FileCheck, cls: "bg-cyan-500/10 text-cyan-600" }, order: { Icon: ShoppingBag, cls: "bg-orange-500/10 text-orange-600" },
  service: { Icon: MapPin, cls: "bg-teal-500/10 text-teal-600" }, lead: { Icon: UserPlus, cls: "bg-yellow-500/10 text-yellow-600" },
  review: { Icon: Star, cls: "bg-amber-500/10 text-amber-600" }, customer: { Icon: UserCheck, cls: "bg-secondary text-muted-foreground" },
};
const DEF = { Icon: UserCheck, cls: "bg-secondary text-muted-foreground" };
const metaOf = (t: string) => META[t.split("_")[0] ?? ""] ?? DEF;

function EventLink({ e, children }: { e: TimelineEvent; children: ReactNode }) {
  const c = "font-semibold text-primary hover:underline";
  if (e.entityType === "invoice") return <Link to="/billing" search={{ invoice: e.entityId }} className={c}>{children}</Link>;
  if (e.entityType === "quote") return <Link to="/quotes" search={{ quote: e.entityId }} className={c}>{children}</Link>;
  if (e.entityType === "order") return <Link to="/orders/$orderId" params={{ orderId: e.entityId }} className={c}>{children}</Link>;
  if (e.entityType === "lead") return <Link to="/leads" className={c}>{children}</Link>;
  if (e.entityType === "route_stop") return <Link to="/routes" search={{ customer: undefined, cname: undefined, cphone: undefined, caddr: undefined }} className={c}>{children}</Link>;
  return <span className="font-semibold text-foreground">{children}</span>;
}

export function CustomerTimeline({ customerId }: { customerId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState("all");
  const [offset, setOffset] = useState(0); const [more, setMore] = useState(true); const [loading, setLoading] = useState(true);
  const load = useCallback(async (off: number) => {
    const page = await getCustomerTimeline(customerId, 20, off);
    setEvents((prev) => (off === 0 ? page : [...prev, ...page])); setMore(page.length === 20); setLoading(false);
  }, [customerId]);
  useEffect(() => { setLoading(true); void load(0); }, [load]);
  if (loading) return <p className="p-4 text-sm text-muted-foreground">…</p>;
  if (events.length === 0) return <p className="p-6 text-center text-sm text-muted-foreground">Sin actividad registrada.</p>;
  const shown = filter === "all" ? events : events.filter((e) => e.eventType.startsWith(filter));
  return (
    <div className="space-y-3">
      <TimelineFilters value={filter} onChange={setFilter} />
      {shown.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Sin eventos de este tipo.</p>}
      {shown.map((e, i) => { const m = metaOf(e.eventType);
        return (
          <div key={i} className="flex gap-3">
            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${m.cls}`}><m.Icon className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1 border-b border-border pb-3">
              <p className="text-sm"><EventLink e={e}>{e.title}</EventLink></p>
              {e.subtitle && <p className="truncate text-xs text-muted-foreground">{e.subtitle}</p>}
              <p className="text-[10px] text-muted-foreground">{e.eventDate.slice(0, 10)}{e.actorName ? ` · ${e.actorName}` : ""}</p>
            </div>
          </div>); })}
      {more && <button type="button" onClick={() => { const o = offset + 20; setOffset(o); void load(o); }} className="w-full rounded-lg bg-secondary py-2 text-sm font-bold">Cargar más</button>}
    </div>
  );
}
