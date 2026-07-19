import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { PasswordInput } from "@shared/components/PasswordInput";
import { usePublicBrand } from "@landing-public/presentation/usePublicBrand.hook";
import { signUpCustomer, signInCustomer } from "@shared/portal/portal-auth";
import { registerCustomer } from "@shared/portal/customer.repository";
import { setPending } from "@shared/portal/pending-register";

export const Route = createFileRoute("/portal/register")({ component: PortalRegister });

function PortalRegister() {
  const { t } = useI18n(); const nav = useNavigate(); const b = usePublicBrand();
  const tenantId = b.status === "ready" ? b.brand.tenantId : null;
  const [f, setF] = useState({ name: "", phone: "", email: "", pw: "" });
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false);
  const fld = "w-full rounded-lg bg-secondary text-foreground p-3 font-body";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    const up = await signUpCustomer(f.email, f.pw, { tenantId, name: f.name, phone: f.phone }); if (up) { setBusy(false); return setErr(up); }
    if (tenantId) setPending({ tenantId, name: f.name, phone: f.phone }); // el guard completa el perfil tras confirmar/login
    const inErr = await signInCustomer(f.email, f.pw); // confirmación OFF → sesión lista; ON → cae a "revisa tu correo"
    if (!inErr && tenantId) { await registerCustomer(tenantId, f.name, f.phone); setBusy(false); return void nav({ to: "/portal" }); }
    setBusy(false); setSent(true);
  };
  if (sent) return <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground"><p className="max-w-sm text-center text-sm text-muted-foreground">{t("pConfirmEmail")}</p></main>;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        <h1 className="text-center font-display text-2xl font-bold">{t("pRegister")}</h1>
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t("pFullName")} className={fld} />
        <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder={t("pPhone")} className={fld} />
        <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder={t("email")} autoComplete="email" className={fld} />
        <PasswordInput value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} placeholder={t("pPassword")} autoComplete="new-password" className={fld} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-primary p-3 font-bold text-primary-foreground disabled:opacity-50">{busy ? "…" : t("pRegister")}</button>
        <p className="text-center text-sm text-muted-foreground">{t("pHaveAccount")} <Link to="/portal/login" className="font-bold text-foreground">{t("pLogin")}</Link></p>
      </form>
    </main>
  );
}
