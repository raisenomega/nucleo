import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { supabase } from "@shared/lib/supabase";

// Ola 2.8a · tracker cliente (humanos). Fire-and-forget, NUNCA bloquea la UI. visitor_id anónimo (no PII).
const VKEY = "_nr_vid"; const SKEY = "_nr_sid"; const SUTM = "_nr_utm"; const SAIR = "_nr_air";
const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

function visitorId(): string {
  try { let v = localStorage.getItem(VKEY); if (!v) { v = uuid(); localStorage.setItem(VKEY, v); } return v; } catch { return ""; }
}
function sessionId(): string {
  try {
    const now = Date.now(); const raw = sessionStorage.getItem(SKEY); const p = raw ? JSON.parse(raw) as { id: string; t: number } : null;
    const id = p && now - p.t < 30 * 60000 ? p.id : uuid();
    sessionStorage.setItem(SKEY, JSON.stringify({ id, t: now })); return id;
  } catch { return ""; }
}
// UTMs: se capturan en el primer pageview con campaña y se persisten en la sesión (atribución correcta).
function utms(): Record<string, string> {
  try {
    const cached = sessionStorage.getItem(SUTM); if (cached) return JSON.parse(cached) as Record<string, string>;
    const q = new URLSearchParams(window.location.search); const u: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign"]) { const v = q.get(k); if (v) u[k] = v; }
    if (Object.keys(u).length) sessionStorage.setItem(SUTM, JSON.stringify(u));
    return u;
  } catch { return {}; }
}

export function track(eventType: string, extras?: Record<string, unknown>): void {
  try {
    if (typeof window === "undefined") return;
    const u = utms();
    void supabase.rpc("track_landing_event", { _payload: {
      host: window.location.host, event_type: eventType, path: window.location.pathname,
      visitor_id: visitorId(), session_id: sessionId(), referrer: document.referrer || "", user_agent: navigator.userAgent,
      utm_source: u.utm_source ?? null, utm_medium: u.utm_medium ?? null, utm_campaign: u.utm_campaign ?? null, ...extras,
    } }).then(() => undefined, () => undefined);
  } catch { /* nunca rompe la UI */ }
}

// Ola 2.8b · referral de IA: un humano que llega desde una respuesta de IA (chatgpt.com, perplexity.ai…). Es
// la señal más valiosa (te están CITANDO, no solo leyendo). Se detecta por el referrer del pageview.
function aiReferrer(ref: string): string | null {
  const r = ref.toLowerCase();
  if (r.includes("chatgpt.com") || r.includes("chat.openai.com")) return "chatgpt";
  if (r.includes("perplexity.ai")) return "perplexity";
  if (r.includes("claude.ai")) return "claude";
  if (r.includes("gemini.google.com") || r.includes("bard.google.com")) return "gemini";
  if (r.includes("copilot.microsoft.com") || r.includes("bing.com/chat")) return "copilot";
  if (r.includes("you.com")) return "you";
  if (r.includes("poe.com")) return "poe";
  return null;
}
// document.referrer es el de ENTRADA a la sesión (estable entre navegaciones SPA) → se emite UNA vez por sesión.
function maybeAiReferral(): void {
  try {
    if (typeof window === "undefined" || sessionStorage.getItem(SAIR)) return;
    const src = aiReferrer(document.referrer || "");
    if (!src) return;
    sessionStorage.setItem(SAIR, "1");
    track("ai_referral", { metadata: { source: src } });
  } catch { /* nunca rompe la UI */ }
}

// Pageview automático en el montaje y en cada cambio de ruta (para los roots de landing).
export function usePageview(): void {
  const { pathname } = useLocation();
  useEffect(() => { track("page_view"); maybeAiReferral(); }, [pathname]);
}
