import { useState } from "react";
import { supabase } from "@shared/lib/supabase";

// Cuenta demo pública (VitalMotion). Credenciales visibles a propósito.
const EMAIL = "demo@nucleo.com";
const PASS = "Demo12345";

const T = {
  es: { title: "Prueba NÚCLEO ahora", sub: "Explora una cuenta completa con datos reales de un negocio en operación. Sin tarjeta, sin registro.",
    f1: "Clientes con historial", f2: "Facturas, cotizaciones y órdenes", f3: "Inventario, GPS, RRHH y contabilidad", f4: "Todos los módulos activos",
    reset: "Los datos se reinician cada 24 horas", enter: "Entrar al demo", copy: "Copiar", copied: "¡Copiado!", loading: "Entrando…", err: "No se pudo entrar. Intenta de nuevo." },
  en: { title: "Try NÚCLEO now", sub: "Explore a full account with real data from a running business. No card, no signup.",
    f1: "Customers with history", f2: "Invoices, quotes and orders", f3: "Inventory, GPS, HR and accounting", f4: "All modules active",
    reset: "Data resets every 24 hours", enter: "Enter the demo", copy: "Copy", copied: "Copied!", loading: "Entering…", err: "Could not sign in. Try again." },
};

export function DemoAccessModal({ lang, onClose }: { lang: "es" | "en"; onClose: () => void }) {
  const c = T[lang];
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${EMAIL} / ${PASS}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  };
  const enter = async () => {
    setBusy(true); setErr(false);
    const { error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASS });
    if (error) { setBusy(false); setErr(true); return; }
    window.location.assign("/dashboard");  // mismo origen: la sesión demo vive en este host
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-700 bg-neutral-900 p-6 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-xl font-bold">🚀 {c.title}</h2>
          <button type="button" onClick={onClose} aria-label="close" className="text-neutral-400 hover:text-white">✕</button>
        </div>
        <p className="text-sm text-neutral-300">{c.sub}</p>
        <ul className="space-y-1 text-sm text-neutral-200">
          {[c.f1, c.f2, c.f3, c.f4].map((f) => <li key={f} className="flex gap-2"><span className="text-emerald-400">✓</span>{f}</li>)}
        </ul>
        <p className="text-xs font-semibold text-amber-400">⏱️ {c.reset}</p>
        <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-3 text-sm">
          <p>📧 <span className="font-mono">{EMAIL}</span></p>
          <p>🔐 <span className="font-mono">{PASS}</span></p>
          <button type="button" onClick={() => void copy()} className="mt-2 rounded bg-neutral-700 px-2 py-1 text-xs font-bold hover:bg-neutral-600">📋 {copied ? c.copied : c.copy}</button>
        </div>
        {err && <p className="text-sm text-red-400">{c.err}</p>}
        <button type="button" disabled={busy} onClick={() => void enter()}
          className="w-full rounded-full bg-amber-500 px-4 py-3 font-display font-bold text-black transition-transform hover:scale-[1.02] disabled:opacity-60">
          {busy ? c.loading : `${c.enter} →`}
        </button>
      </div>
    </div>
  );
}
