import type { AiVisibility } from "@shared/analytics/analytics.repository";

const BOT_LABEL: Record<string, string> = {
  openai_gptbot: "GPTBot (OpenAI)", openai_search: "OAI-SearchBot", openai_user: "ChatGPT-User",
  anthropic: "ClaudeBot", perplexity: "PerplexityBot", google_extended: "Google-Extended", common_crawl: "CCBot",
  bytedance: "Bytespider", amazon: "Amazonbot", meta: "Meta AI", apple: "Applebot", cohere: "Cohere",
};
const SRC_LABEL: Record<string, string> = {
  chatgpt: "ChatGPT", perplexity: "Perplexity", claude: "Claude", gemini: "Gemini", copilot: "Copilot", you: "You.com", poe: "Poe",
};
const ago = (iso: string): string => {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d}d`;
};

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
