import { useCallback, useEffect, useState } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { getCampaignAnalytics, type CampaignAnalytics } from "@campaigns/infrastructure/campaign-analytics.repository";

const PERIODS = [7, 30, 90];

// Tab "Rendimiento" del editor: KPIs (visitas/leads/conversión) + gráfico visitas-por-día + fuentes, desde el
// motor de 2.8 por path. `onViewLeads` abre el inbox del scope (/leads del tenant o /web/leads del superadmin).
export function CampaignPerformance({ pageId, onViewLeads }: { pageId: string; onViewLeads: () => void }) {
  const [days, setDays] = useState(30);
  const [a, setA] = useState<CampaignAnalytics | null>(null);
  const load = useCallback(async () => setA(await getCampaignAnalytics(pageId, days)), [pageId, days]);
  useEffect(() => { void load(); }, [load]);
  const conv = a && a.visits > 0 ? ((a.leads / a.visits) * 100).toFixed(1) : "0";
  const kpi = (l: string, v: string | number) => (<div className="rounded-lg border border-border bg-card p-3 text-center"><p className="text-[10px] uppercase text-muted-foreground">{l}</p><p className="text-xl font-bold text-foreground">{v}</p></div>);
  return (
    <div className="space-y-4">
      <div className="flex gap-1">{PERIODS.map((p) => <button key={p} type="button" onClick={() => setDays(p)} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${days === p ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{p}d</button>)}</div>
      {!a ? <p className="text-sm text-muted-foreground">Cargando…</p> : (<>
        <div className="grid grid-cols-3 gap-3">{kpi("Visitas", a.visits)}{kpi("Leads", a.leads)}{kpi("Conversión", `${conv}%`)}</div>
        {a.byDay.length > 0 && <div className="rounded-lg border border-border bg-card p-4"><p className="mb-2 text-sm font-bold text-foreground">Visitas por día</p>
          <ResponsiveContainer width="100%" height={180}><BarChart data={a.byDay}><XAxis dataKey="day" tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}
        <div className="rounded-lg border border-border bg-card p-4"><p className="mb-2 text-sm font-bold text-foreground">Fuentes de tráfico</p>
          {a.sources.length === 0 ? <p className="text-xs text-muted-foreground">Sin datos todavía.</p> : a.sources.map((s, i) => <div key={i} className="flex justify-between gap-2 border-t border-border py-1 text-sm"><span className="min-w-0 truncate text-muted-foreground">{s.source}</span><span className="shrink-0 font-bold">{s.count}</span></div>)}</div>
        <button type="button" onClick={onViewLeads} className="text-sm font-bold text-primary hover:underline">Ver los {a.leads} leads en el inbox →</button>
      </>)}
    </div>
  );
}
