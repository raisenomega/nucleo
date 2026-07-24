import { BOT_LABEL, SRC_LABEL, RES_LABEL, agoDays } from "@shared/analytics/ai-labels";
import type { PlatformAnalytics } from "@shared/analytics/platform-analytics.repository";

// Ola 2.8c · panel AEO/GEO detallado del superadmin. Separa las dos señales (crawls = te leen · referrals = te
// citan) y agrega la tendencia de crawls vs el período previo — la señal de si el AEO/SEO está funcionando.
export function PlatformAiPanel({ ai }: { ai: PlatformAnalytics["ai"] }) {
  const trend = ai.trendPct;
  const row = (k: number, label: string, n: number, extra?: string) => (
    <div key={k} className="flex justify-between gap-2 border-t border-border py-1 text-sm">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <span className="shrink-0 font-bold">{n}{extra && <span className="font-normal text-muted-foreground"> · {extra}</span>}</span>
    </div>
  );
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-foreground">Visibilidad en IA</p>
        {trend !== null && <span className={`text-xs font-bold ${trend >= 0 ? "text-emerald-500" : "text-red-500"}`}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% crawls vs período previo</span>}
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Crawls = los motores IA te leen · Referrals = usuarios reales llegaron desde una respuesta de IA (te citan).</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Crawls por bot · <span className="font-bold text-foreground">{ai.crawls}</span></p>
          {ai.crawlsByBot.length === 0 ? <p className="mt-1 text-xs text-muted-foreground">Ningún bot IA te ha visitado.</p>
            : ai.crawlsByBot.map((b, i) => row(i, BOT_LABEL[b.bot] ?? b.bot, b.count, agoDays(b.last)))}
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Por recurso</p>
          {ai.byResource.length === 0 ? <p className="mt-1 text-xs text-muted-foreground">—</p>
            : ai.byResource.map((r, i) => row(i, RES_LABEL[r.resource] ?? r.resource, r.count))}
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Referrals · <span className="font-bold text-foreground">{ai.referrals}</span>{ai.referralConversions > 0 && <span className="text-muted-foreground"> · {ai.referralConversions} conv.</span>}</p>
          {ai.referralsBySource.length === 0 ? <p className="mt-1 text-xs text-muted-foreground">Aún no te citan (normal al principio).</p>
            : ai.referralsBySource.map((s, i) => row(i, SRC_LABEL[s.source] ?? s.source, s.count))}
        </div>
      </div>
    </div>
  );
}
