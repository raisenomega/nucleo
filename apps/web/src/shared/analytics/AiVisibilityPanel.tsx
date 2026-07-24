import type { AiVisibility } from "@shared/analytics/analytics.repository";
import { BOT_LABEL, SRC_LABEL, agoDays as ago } from "@shared/analytics/ai-labels";

// Ola 2.8b · panel AEO/GEO. Dos señales que NO se mezclan: crawls (te leen) vs referrals (te citan — más valioso).
export function AiVisibilityPanel({ ai }: { ai: AiVisibility }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-1 text-sm font-bold text-foreground">Visibilidad en IA</p>
      <p className="mb-3 text-xs text-muted-foreground">Crawls = los motores IA leen tu sitio · Referrals = usuarios reales llegaron desde una respuesta de IA (te están citando).</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Crawls (te leen) · <span className="font-bold text-foreground">{ai.crawls}</span></p>
          {ai.crawlsByBot.length === 0
            ? <p className="mt-1 text-xs text-muted-foreground">Ningún bot IA te ha visitado — revisá robots.txt y llms.txt.</p>
            : ai.crawlsByBot.map((b, i) => <div key={i} className="flex justify-between gap-2 border-t border-border py-1 text-sm"><span className="min-w-0 truncate text-muted-foreground">{BOT_LABEL[b.bot] ?? b.bot}</span><span className="shrink-0 font-bold">{b.count} <span className="font-normal text-muted-foreground">· {ago(b.last)}</span></span></div>)}
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Referrals (te citan) · <span className="font-bold text-foreground">{ai.referrals}</span>{ai.referralConversions > 0 && <span className="text-muted-foreground"> · {ai.referralConversions} conv.</span>}</p>
          {ai.referralsBySource.length === 0
            ? <p className="mt-1 text-xs text-muted-foreground">{ai.crawls > 0 ? "Te leen pero aún no te citan (normal al principio)." : "Sin tráfico desde IA todavía."}</p>
            : ai.referralsBySource.map((s, i) => <div key={i} className="flex justify-between gap-2 border-t border-border py-1 text-sm"><span className="min-w-0 truncate text-muted-foreground">{SRC_LABEL[s.source] ?? s.source}</span><span className="shrink-0 font-bold">{s.count}</span></div>)}
        </div>
      </div>
    </div>
  );
}
