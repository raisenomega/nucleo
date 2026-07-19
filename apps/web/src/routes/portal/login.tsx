import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { PasswordInput } from "@shared/components/PasswordInput";
import { usePublicBrand } from "@landing-public/presentation/usePublicBrand.hook";
import { signInCustomer, magicLinkCustomer } from "@shared/portal/portal-auth";

export const Route = createFileRoute("/portal/login")({ component: PortalLogin });

function PortalLogin() {
  const { t } = useI18n(); const nav = useNavigate(); const b = usePublicBrand();
  const name = b.status === "ready" ? b.brand.displayName : "";
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false);
  const login = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr(null); const m = await signInCustomer(email, pw); setBusy(false); if (m) setErr(m); else void nav({ to: "/portal" }); };
  const magic = async () => { if (!email) return setErr(t("pEmailFirst")); const m = await magicLinkCustomer(email); if (m) setErr(m); else setSent(true); };
  const fld = "w-full rounded-lg bg-secondary text-foreground p-3 font-body";
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <form onSubmit={login} className="w-full max-w-sm space-y-4">
        <h1 className="text-center font-display text-2xl font-bold">{name}</h1>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")} autoComplete="email" className={fld} />
        <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t("pPassword")} autoComplete="current-password" className={fld} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        {sent && <p className="text-sm text-green-600">{t("pMagicSent")}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-primary p-3 font-bold text-primary-foreground disabled:opacity-50">{busy ? "…" : t("pLogin")}</button>
        <button type="button" onClick={() => void magic()} className="w-full rounded-lg bg-secondary p-3 text-sm">{t("pMagicLink")}</button>
        <p className="text-center text-sm text-muted-foreground">{t("pNoAccount")} <Link to="/portal/register" className="font-bold text-foreground">{t("pRegister")}</Link></p>
      </form>
    </main>
  );
}
