import { useCallback, useEffect, useState } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { getLandingAnalytics, type LandingAnalytics } from "@shared/analytics/analytics.repository";
import { AiVisibilityPanel } from "@shared/analytics/AiVisibilityPanel";

const PERIODS = [7, 30, 90];

// Ola 2.8a · dashboard de analytics de la landing del tenant (KPIs + visitas/día + top páginas + fuentes).
export function TenantAnalyticsPanel() {
  const [days, setDays] = useState(30);
  const [a, setA] = useState<LandingAnalytics | null>(null);
  const load = useCallback(async () => setA(await getLandingAnalytics(days)), [days]);
  useEffect(() => { void load(); }, [load]);
  const kpi = (label: string, v: number) => (<div className="rounded-lg border border-border bg-card p-3 text-center"><p className="text-[10px] uppercase text-muted-foreground">{label}</p><p className="text-xl font-bold text-foreground">{v}</p></div>);
  const rows = (items: { label: string; n: number }[]) => items.length === 0 ? <p className="text-xs text-muted-foreground">Sin datos.</p> : items.map((x, i) => <div key={i} className="flex justify-between gap-2 border-t border-border py-1 text-sm"><span className="min-w-0 truncate text-muted-foreground">{x.label}</span><span className="shrink-0 font-bold">{x.n}</span></div>);
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">Analytics de la landing</h1>
        <div className="flex gap-1">{PERIODS.map((p) => <button key={p} type="button" onClick={() => setDays(p)} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${days === p ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{p}d</button>)}</div>
      </div>
      {!a ? <p className="text-sm text-muted-foreground">Cargando…</p> : (<>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{kpi("Visitas", a.visits)}{kpi("Visitantes", a.visitors)}{kpi("Sesiones", a.sessions)}{kpi("Conversiones", a.conversions)}</div>
        {a.byDay.length > 0 && <div className="rounded-lg border border-border bg-card p-4"><p className="mb-2 text-sm font-bold text-foreground">Visitas por día</p>
          <ResponsiveContainer width="100%" height={180}><BarChart data={a.byDay}><XAxis dataKey="day" tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4"><p className="mb-2 text-sm font-bold text-foreground">Top páginas</p>{rows(a.topPages.map((p) => ({ label: p.path, n: p.views })))}</div>
          <div className="rounded-lg border border-border bg-card p-4"><p className="mb-2 text-sm font-bold text-foreground">Fuentes</p>{rows(a.sources.map((s) => ({ label: s.source, n: s.count })))}</div>
        </div>
        <AiVisibilityPanel ai={a.ai} />
        <p className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-center text-xs text-muted-foreground">¿Necesitas análisis avanzado de marketing? Conecta con <a href="https://www.omegaraisen.agency" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">OMEGA</a>.</p>
      </>)}
    </div>
  );
}
