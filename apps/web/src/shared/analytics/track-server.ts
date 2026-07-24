// Ola 2.8b · captura server-side de crawls de bots IA. Los bots NO ejecutan JS → el tracker cliente (2.8a) no
// los ve; por eso se capturan desde los handlers Nitro (llms/sitemap/robots), que reciben ~100% tráfico crawler.
// Fire-and-forget ESTRICTO: nunca se hace await en el handler, nunca bloquea la respuesta.

// Superset de los UAs que _classify_ai_bot reconoce en la DB. Este gate evita pegarle a la DB en el caso común
// (humanos, Googlebot, monitores de uptime); si pasa, la RPC reclasifica y decide el label final (o 'not_ai').
const AI_BOT_RE = /GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|anthropic-ai|Claude-Web|PerplexityBot|Perplexity-User|Google-Extended|CCBot|Bytespider|Amazonbot|meta-externalagent|FacebookBot|Applebot-Extended|cohere-ai/i;

export interface AiCrawlPayload {
  user_agent: string | undefined;
  host: string;
  path: string;
  resource: string;
}

// import.meta.env se inyecta en build (cliente y servidor); el env de Nitro se lee por globalThis para no
// depender de @types/node. Mismo helper que @shared/seo/seo-data.
function env(k: string): string {
  const m = (import.meta as { env?: Record<string, string> }).env?.[k];
  if (m) return m;
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return g.process?.env?.[k] ?? "";
}

// Dispara track_ai_crawl vía REST con la anon key (la función es SECURITY DEFINER granted anon). El resultado
// se ignora por completo. Cualquier fallo se traga: esto JAMÁS debe afectar la velocidad ni el status del endpoint.
export function trackAiCrawl(p: AiCrawlPayload): void {
  try {
    const ua = p.user_agent ?? "";
    if (!AI_BOT_RE.test(ua)) return;
    const base = env("VITE_SUPABASE_URL"), key = env("VITE_SUPABASE_ANON_KEY");
    if (!base || !key) return;
    void fetch(`${base}/rest/v1/rpc/track_ai_crawl`, {
      method: "POST",
      headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ _payload: { user_agent: ua, host: p.host, path: p.path, resource: p.resource } }),
    }).then(() => undefined, () => undefined);
  } catch { /* nunca rompe el handler */ }
}
