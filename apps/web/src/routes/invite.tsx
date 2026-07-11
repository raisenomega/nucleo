import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";

export const Route = createFileRoute("/invite")({ component: Invite });

function Invite() {
  const { t } = useI18n();
  const [f, setF] = useState({ email: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"ok" | "exists" | null>(null);
  const field = "w-full rounded-lg bg-secondary text-foreground p-3 font-body";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (f.password.length < 8) return void setError(t("minPassword"));
    if (f.password !== f.confirm) return void setError(t("passwordMismatch"));
    setBusy(true);
    const { error: err } = await supabase.auth.signUp({ email: f.email, password: f.password });
    setBusy(false);
    if (!err) return void setDone("ok");
    if (/already registered/i.test(err.message)) return void setDone("exists");
    setError(err.message);
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="max-w-sm space-y-4 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">{done === "ok" ? t("accountCreated") : t("alreadyRegistered")}</h1>
          <Link to="/login" className="inline-block font-body font-bold text-foreground">{t("goToLogin")}</Link>
        </div>
      </main>
    );
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
        <h1 className="text-center font-display text-3xl font-bold text-foreground">{t("joinTeam")}</h1>
        <p className="text-center text-sm text-muted-foreground">{t("invitedSubtitle")}</p>
        <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder={t("email")} autoComplete="email" className={field} />
        <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder={t("createPassword")} autoComplete="new-password" className={field} />
        <input type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} placeholder={t("confirmPassword")} autoComplete="new-password" className={field} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-primary text-primary-foreground p-3 font-body font-bold disabled:opacity-50">
          {busy ? "…" : t("createPassword")}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          {t("businessOwner")} <Link to="/registro" className="text-foreground">{t("trialFree")}</Link>
        </p>
      </form>
    </main>
  );
}
