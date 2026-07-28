import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { supabase } from "@shared/lib/supabase";

// Pantalla intermedia de login: pide el código TOTP para elevar la sesión a AAL2.
export function MfaChallenge({ onVerified }: { onVerified: () => void }) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.mfa.listFactors().then(({ data }) => {
      const f = data?.totp?.find((x) => x.status === "verified") ?? data?.totp?.[0];
      if (f) setFactorId(f.id);
    });
  }, []);

  const verify = async () => {
    if (!factorId || code.length < 6) return;
    setBusy(true); setErr("");
    const ch = await supabase.auth.mfa.challenge({ factorId });
    if (ch.error || !ch.data) { setBusy(false); setErr(ch.error?.message ?? "error"); return; }
    const v = await supabase.auth.mfa.verify({ factorId, challengeId: ch.data.id, code });
    setBusy(false);
    if (v.error) { setErr(t("mfaBadCode")); void supabase.rpc("log_mfa_event", { p_type: "mfa_challenge_failed" }); return; }
    onVerified();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">{t("mfaChallengeTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("mfaChallengeHint")}</p>
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric" placeholder="000000" autoFocus
          className="w-full rounded-lg border border-border bg-background p-3 text-center text-2xl tracking-widest text-foreground" />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button type="button" disabled={busy || code.length < 6} onClick={() => void verify()}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("mfaVerify")}</button>
        <button type="button" onClick={() => void supabase.auth.signOut()} className="w-full text-xs text-muted-foreground">{t("logout")}</button>
      </div>
    </main>
  );
}
