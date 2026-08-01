import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { listSubscriptions, cancelSubscription, type Subscription, type CancelCode } from "@billing/infrastructure/supabase-subscriptions.repository";
import type { TranslationKey } from "@shared/i18n/translations.keys";

// stripe_rejected trae el motivo literal de Stripe en `detail`; el resto son codigos y se traducen.
const ERR: Record<CancelCode, TranslationKey> = { not_found: "subsErrNotFound", forbidden: "subsErrForbidden",
  no_secret: "subsErrNoSecret", stripe_unreachable: "subsErrUnreachable", stripe_rejected: "subsErrRejected", rpc: "subsErrRejected" };

const money = (n: number) => `$${(n ?? 0).toFixed(2)}`;
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

// Tab de staff: lista de suscripciones Stripe activas + cancelar (cancel_at_period_end).
export function SubscriptionsTab() {
  const { t } = useI18n(); const toast = useToast();
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = () => void listSubscriptions().then(setSubs);
  useEffect(load, []);
  const cancel = async (id: string) => {
    if (!window.confirm(t("subsCancelConfirm"))) return;
    setBusy(id); const r = await cancelSubscription(id); setBusy(null);
    // Si fallo, la suscripcion sigue activa: no se recarga la lista para no sugerir que algo cambio.
    if (!r.ok) { toast.error(r.error.detail ?? t(ERR[r.error.code])); return; }
    load();
  };
  if (!subs) return <p className="text-sm text-muted-foreground">…</p>;
  if (!subs.length) return <p className="text-sm text-muted-foreground">{t("subsEmpty")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-muted-foreground">
          <th className="p-2">{t("clientName")}</th><th className="p-2">{t("subsItem")}</th><th className="p-2">{t("subsFrequency")}</th>
          <th className="p-2 text-right">{t("subsAmount")}</th><th className="p-2">{t("subsStatus")}</th><th className="p-2">{t("subsNextCharge")}</th><th className="p-2" />
        </tr></thead>
        <tbody>{subs.map((s) => (
          <tr key={s.id} className="border-t border-border">
            <td className="p-2 font-bold text-foreground">{s.customer ?? s.email}</td>
            <td className="p-2">{s.item ?? "—"}</td><td className="p-2">{s.frequency ?? "—"}</td>
            <td className="p-2 text-right font-mono">{money(s.amount)}</td>
            <td className="p-2"><span className={`rounded px-1.5 py-0.5 text-xs font-bold ${s.status === "active" ? "text-green-600" : "text-orange-600"}`}>{s.status}{s.cancelAtPeriodEnd ? " ⏳" : ""}</span></td>
            <td className="p-2">{fmt(s.currentPeriodEnd)}</td>
            <td className="p-2 text-right">{s.status === "active" && !s.cancelAtPeriodEnd && <button type="button" disabled={busy === s.id} onClick={() => void cancel(s.id)} className="rounded border border-destructive px-2 py-1 text-xs font-bold text-destructive disabled:opacity-50">{t("subsCancel")}</button>}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
