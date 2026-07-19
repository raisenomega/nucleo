import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { PasswordInput } from "@shared/components/PasswordInput";
import { updatePassword } from "@shared/portal/settings.repository";

// Cambiar contraseña del cliente (Supabase auth).
export function PortalPasswordForm() {
  const { t } = useI18n();
  const [pw, setPw] = useState(""); const [msg, setMsg] = useState<"" | "ok" | "err">(""); const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { setMsg("err"); return; }
    setBusy(true); const err = await updatePassword(pw); setBusy(false);
    setMsg(err ? "err" : "ok"); if (!err) setPw("");
  };
  return (
    <form onSubmit={save} className="space-y-2">
      <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t("pNewPassword")} autoComplete="new-password" className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
      {msg === "ok" && <p className="text-sm text-green-600">{t("pProfileSaved")}</p>}
      {msg === "err" && <p className="text-sm text-destructive">{t("pPasswordShort")}</p>}
      <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("save")}</button>
    </form>
  );
}
