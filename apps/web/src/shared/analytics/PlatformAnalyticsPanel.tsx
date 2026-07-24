import { useCallback, useEffect, useState } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { getPlatformAnalytics, type PlatformAnalytics } from "@shared/analytics/platform-analytics.repository";
import { PlatformFunnel } from "@shared/analytics/PlatformFunnel";
import { PlatformAiPanel } from "@shared/analytics/PlatformAiPanel";

const PERIODS = [7, 30, 90];

// Ola 2.8c · dashboard avanzado del superadmin (nucleoraisen.com): KPIs, embudo comercial, tráfico, AEO/GEO
// detallado y campañas. Reúsa recharts. Las señales ai_crawl y ai_referral van separadas (no se mezclan).
export function PlatformAnalyticsPanel() {
  const [days, setDays] = useState(30);
  const [d, setD] = useState<PlatformAnalytics | null>(null);
  const load = useCallback(async () => setD(await getPlatformAnalytics(days)), [days]);
  useEffect(() => { void load(); }, [load]);
  const kpi = (label: string, v: string | number) => (<div className="rounded-lg border border-border bg-card p-3 text-center"><p className="text-[10px] uppercase text-muted-foreground">{label}</p><p className="text-xl font-bold text-foreground">{v}</p></div>);
  const rows = (items: { label: string; n: number }[]) => items.length === 0 ? <p className="text-xs text-muted-foreground">Sin datos.</p> : items.map((x, i) => <div key={i} className="flex justify-between gap-2 border-t border-border py-1 text-sm"><span className="min-w-0 truncate text-muted-foreground">{x.label}</span><span className="shrink-0 font-bold">{x.n}</span></div>);
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="font-display text-xl font-bold text-foreground md:text-3xl">Analytics de plataforma</h1><p className="text-xs text-muted-foreground">nucleoraisen.com · embudo comercial + visibilidad en IA</p></div>
        <div className="flex gap-1">{PERIODS.map((p) => <button key={p} type="button" onClick={() => setDays(p)} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${days === p ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{p}d</button>)}</div>
      </div>
      {!d ? <p className="text-sm text-muted-foreground">Cargando…</p> : (<>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{kpi("Visitas", d.traffic.visits.toLocaleString())}{kpi("Leads", d.funnel.leads)}{kpi("Demos", d.funnel.demos)}{kpi("Conv. visita→lead", `${d.funnel.visitToLead}%`)}</div>
        <PlatformFunnel {...d.funnel} />
        {d.traffic.byDay.length > 0 && <div className="rounded-lg border border-border bg-card p-4"><p className="mb-2 text-sm font-bold text-foreground">Visitas por día</p>
          <ResponsiveContainer width="100%" height={180}><BarChart data={d.traffic.byDay}><XAxis dataKey="day" tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4"><p className="mb-2 text-sm font-bold text-foreground">Top páginas</p>{rows(d.traffic.topPages.map((p) => ({ label: p.path, n: p.views })))}</div>
          <div className="rounded-lg border border-border bg-card p-4"><p className="mb-2 text-sm font-bold text-foreground">Fuentes de tráfico</p>{rows(d.traffic.sources.map((s) => ({ label: s.source, n: s.count })))}</div>
        </div>
        <PlatformAiPanel ai={d.ai} />
        <div className="rounded-lg border border-border bg-card p-4"><p className="mb-2 text-sm font-bold text-foreground">Campañas</p>
          {d.campaigns.length === 0 ? <p className="text-xs text-muted-foreground">Sin campañas activas (listo para cuando lances ads con utm_campaign).</p>
            : <><div className="flex justify-between border-b border-border pb-1 text-[10px] uppercase text-muted-foreground"><span>Campaña</span><span>Visitas · Leads</span></div>{d.campaigns.map((c, i) => <div key={i} className="flex justify-between gap-2 border-t border-border py-1 text-sm"><span className="min-w-0 truncate text-muted-foreground">{c.campaign}</span><span className="shrink-0 font-bold">{c.visits} · {c.leads}</span></div>)}</>}
        </div>
      </>)}
    </div>
  );
}
