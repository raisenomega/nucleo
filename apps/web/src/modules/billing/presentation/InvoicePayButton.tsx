import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { payView, type PayOpts } from "@billing/presentation/pay-return-state";

const POLL_MS = 3000;
const MAX_POLLS = 6; // ~18s de margen para que llegue el webhook de Stripe

// Botón "Pagar con tarjeta" en la factura pública. Solo si el tenant tiene Stripe activo y hay balance.
// Tras el checkout Stripe vuelve con ?paid=1: eso solo activa "confirmando"; el "pago recibido" exige
// que el servidor reporte balance 0 (lo marca el webhook). Si no llega, se quita la pista y vuelve el botón.
export function InvoicePayButton({ token }: { token: string }) {
  const { t } = useI18n();
  const [returned] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("paid") === "1");
  const [opts, setOpts] = useState<PayOpts>(null);
  const [polls, setPolls] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const gaveUp = polls >= MAX_POLLS;
  const view = payView(opts, returned, gaveUp);

  useEffect(() => {
    let alive = true;
    void supabase.rpc("public_invoice_pay_options", { p_token: token })
      .then(({ data }) => { if (alive) setOpts((data as PayOpts) ?? { stripeEnabled: false }); });
    return () => { alive = false; };
  }, [token, polls]);

  useEffect(() => {
    if (view === "confirming" && opts !== null) { const id = setTimeout(() => setPolls((p) => p + 1), POLL_MS); return () => clearTimeout(id); }
    if (view === "received") { const id = setTimeout(() => window.location.assign(window.location.pathname), POLL_MS); return () => clearTimeout(id); }
    if (returned && gaveUp) window.history.replaceState(null, "", window.location.pathname);
  }, [view, opts, returned, gaveUp]);

  if (view === "received") return <div role="status" className="rounded-lg border border-green-600/40 bg-green-600/10 p-3 text-center text-sm font-bold text-green-700">✅ {t("payReceived")}</div>;
  if (view === "confirming") return <div role="status" className="rounded-lg border border-border p-3 text-center text-sm text-muted-foreground">{t("payConfirming")}</div>;
  if (view === "hidden") return null;

  const pay = async () => {
    setBusy(true); setErr(false);
    const { data } = await supabase.rpc("create_stripe_checkout_session", { p_invoice_token: token, p_order_token: null });
    const r = data as { checkout_url?: string; error?: string } | null;
    if (r?.checkout_url) window.location.assign(r.checkout_url);
    else { setBusy(false); setErr(true); }
  };
  return (
    <div className="space-y-1">
      <button type="button" disabled={busy} onClick={() => void pay()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50">
        <CreditCard className="h-4 w-4" /> {busy ? t("payProcessing") : t("payWithCard")}
      </button>
      {err && <p className="text-sm text-destructive">{t("payError")}</p>}
    </div>
  );
}
