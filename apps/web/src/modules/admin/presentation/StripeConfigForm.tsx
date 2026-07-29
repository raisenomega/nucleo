import { useState } from "react";
import { useI18n } from "@shared/i18n";

// Formulario de claves de Stripe. onSave hace save + validate (devuelve mensaje de error o null).
export function StripeConfigForm({ initialPk, busy, onSave, onCancel }: {
  initialPk?: string; busy: boolean; onSave: (pk: string, sk: string, wh: string) => Promise<string | null>; onCancel?: () => void;
}) {
  const { t } = useI18n();
  const [pk, setPk] = useState(initialPk ?? "");
  const [sk, setSk] = useState("");
  const [wh, setWh] = useState("");
  const [err, setErr] = useState("");
  const inp = "w-full rounded-lg border border-border bg-background p-2 font-mono text-sm";
  const submit = async () => { setErr(""); const e = await onSave(pk.trim(), sk.trim(), wh.trim()); if (e) setErr(e); };
  return (
    <div className="max-w-md space-y-3">
      <div><label className="mb-1 block text-xs font-bold text-muted-foreground">{t("stripePk")}</label>
        <input value={pk} onChange={(e) => setPk(e.target.value)} placeholder="pk_test_..." className={inp} /></div>
      <div><label className="mb-1 block text-xs font-bold text-muted-foreground">{t("stripeSk")}</label>
        <input value={sk} onChange={(e) => setSk(e.target.value)} type="password" placeholder="sk_test_..." className={inp} /></div>
      <div><label className="mb-1 block text-xs font-bold text-muted-foreground">{t("stripeWh")}</label>
        <input value={wh} onChange={(e) => setWh(e.target.value)} type="password" placeholder="whsec_..." className={inp} /></div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={busy || !pk || !sk} onClick={() => void submit()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("stripeSaveValidate")}</button>
        {onCancel && <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>}
      </div>
    </div>
  );
}
