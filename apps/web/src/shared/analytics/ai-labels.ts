// Ola 2.8c · etiquetas legibles para bots/fuentes/recursos de IA. Compartidas por el panel del tenant (2.8b)
// y el de plataforma (2.8c) para no duplicar el mapa. Los slugs vienen de _classify_ai_bot/_classify_ai_referrer.
export const BOT_LABEL: Record<string, string> = {
  openai_gptbot: "GPTBot (OpenAI)", openai_search: "OAI-SearchBot", openai_user: "ChatGPT-User",
  anthropic: "ClaudeBot", perplexity: "PerplexityBot", google_extended: "Google-Extended", common_crawl: "CCBot",
  bytedance: "Bytespider", amazon: "Amazonbot", meta: "Meta AI", apple: "Applebot", cohere: "Cohere",
};
export const SRC_LABEL: Record<string, string> = {
  chatgpt: "ChatGPT", perplexity: "Perplexity", claude: "Claude", gemini: "Gemini", copilot: "Copilot", you: "You.com", poe: "Poe",
};
export const RES_LABEL: Record<string, string> = {
  llms: "llms.txt", llms_full: "llms-full.txt", sitemap: "sitemap.xml", robots: "robots.txt",
};
export const agoDays = (iso: string): string => {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d}d`;
};
