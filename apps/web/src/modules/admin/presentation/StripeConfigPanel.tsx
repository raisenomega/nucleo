import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useStripeConfig } from "@admin/application/useStripeConfig.hook";
import { StripeConfigForm } from "@admin/presentation/StripeConfigForm";

// Ajustes → Métodos de pago (STRIPE-1). 3 estados: sin configurar / editar / conectado.
export function StripeConfigPanel() {
  const { t } = useI18n();
  const { config, busy, save, validate, syncCatalog } = useStripeConfig();
  const [editing, setEditing] = useState(false);
  const [synced, setSynced] = useState<number | null>(null);

  const onSave = async (pk: string, sk: string, wh: string): Promise<string | null> => {
    const e = await save(pk, sk, wh);
    if (e) return e;
    const v = await validate();
    setEditing(false);
    return v?.valid ? null : (v?.error ?? t("stripeValidateFail"));
  };

  if (!config) return <p className="text-sm text-muted-foreground">{t("noData")}</p>;
  const connected = config.configured && config.hasSecret;

  if (!connected || editing) return (
    <div className="space-y-4">
      <p className="max-w-md text-sm text-muted-foreground">{t("stripeIntro")}</p>
      <StripeConfigForm initialPk={config.publishableKey ?? ""} busy={busy} onSave={onSave}
        onCancel={editing ? () => setEditing(false) : undefined} />
    </div>
  );

  return (
    <div className="max-w-md space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display font-bold text-foreground">💳 Stripe</span>
        <span className={`rounded border border-current px-1.5 py-0.5 text-xs font-bold ${config.stripeEnabled ? "text-green-600" : "text-orange-600"}`}>
          {config.stripeEnabled ? t("stripeConnected") : t("stripeNotValidated")}
        </span>
        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-bold">{config.testMode ? "TEST" : "LIVE"}</span>
      </div>
      {config.accountId && <p className="text-sm text-muted-foreground">{t("stripeAccount")}: <span className="font-mono">{config.accountId}</span></p>}
      {config.validationError && <p className="text-sm text-destructive">{config.validationError}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void validate()} className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-bold disabled:opacity-50">{t("stripeRevalidate")}</button>
        <button type="button" onClick={() => setEditing(true)} className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-bold">{t("stripeEditKeys")}</button>
        {config.stripeEnabled && <button type="button" disabled={busy} onClick={() => void syncCatalog().then((r) => setSynced(r?.created ?? 0))} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-50">{t("stripeSyncNow")}</button>}
      </div>
      {synced !== null && <p className="text-sm text-green-600">{t("stripeSynced")}: {synced}</p>}
      <p className="text-xs text-muted-foreground">{t("stripeNextSteps")}</p>
    </div>
  );
}
