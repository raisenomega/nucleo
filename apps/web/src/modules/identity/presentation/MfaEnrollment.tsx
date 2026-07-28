import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useMfa } from "@identity/application/useMfa.hook";

// Activar/desactivar 2FA TOTP. Se monta en Ajustes (tab Seguridad).
export function MfaEnrollment() {
  const { t } = useI18n();
  const { active, qr, msg, busy, start, confirm, disable } = useMfa();
  const [code, setCode] = useState("");

  const submit = async () => { if (await confirm(code, t("mfaBadCode"))) setCode(""); };

  return (
    <div className="max-w-md space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display font-bold text-foreground">{t("mfaTitle")}</h2>
        <span className={`rounded border border-current px-1.5 py-0.5 text-xs font-bold ${active ? "text-green-600" : "text-muted-foreground"}`}>
          {active ? t("mfaStatusOn") : t("mfaStatusOff")}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{t("mfaHint")}</p>

      {active && (
        <button type="button" disabled={busy} onClick={() => void disable()}
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold disabled:opacity-50">{t("mfaDisable")}</button>
      )}

      {!active && !qr && (
        <button type="button" disabled={busy} onClick={() => void start()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("mfaActivate")}</button>
      )}

      {!active && qr && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("mfaScanQr")}</p>
          <img src={qr} alt="QR" className="h-44 w-44 rounded-lg border border-border bg-white p-2" />
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric" placeholder="000000"
            className="w-full rounded-lg border border-border bg-background p-2 text-center text-xl tracking-widest" />
          <button type="button" disabled={busy || code.length < 6} onClick={() => void submit()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("mfaConfirm")}</button>
        </div>
      )}
      {msg && <p className="text-sm text-destructive">{msg}</p>}
    </div>
  );
}
