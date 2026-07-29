import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";

type Opts = { stripeEnabled?: boolean; balance?: number } | null;

// Botón "Pagar con tarjeta" en la factura pública. Solo si el tenant tiene Stripe activo y hay balance.
// Tras el checkout, Stripe redirige con ?paid=1 → el webhook marca la factura; refrescamos a los 5s.
export function InvoicePayButton({ token }: { token: string }) {
  const { t } = useI18n();
  const [opts, setOpts] = useState<Opts>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const paid = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("paid") === "1";

  useEffect(() => {
    void supabase.rpc("public_invoice_pay_options", { p_token: token }).then(({ data }) => setOpts(data as Opts));
    if (paid) { const id = setTimeout(() => window.location.assign(window.location.pathname), 5000); return () => clearTimeout(id); }
  }, [token, paid]);

  if (paid) return <div className="rounded-lg border border-green-600/40 bg-green-600/10 p-3 text-center text-sm font-bold text-green-700">✅ {t("payReceived")}</div>;
  if (!opts?.stripeEnabled || (opts.balance ?? 0) <= 0) return null;

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
