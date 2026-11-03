export type PayOpts = { stripeEnabled?: boolean; balance?: number } | null;
export type PayView = "confirming" | "received" | "button" | "hidden";

// `?paid=1` (success_url de Stripe) es solo una PISTA de "vuelvo del checkout": cualquiera puede escribirla.
// El estado pagado lo decide el balance que devuelve el servidor (public_invoice_pay_options), nunca la URL.
export function payView(opts: PayOpts, returned: boolean, gaveUp: boolean): PayView {
  const settled = typeof opts?.balance === "number" && opts.balance <= 0.01;
  if (returned && settled) return "received";
  if (returned && !gaveUp) return "confirming";
  return opts?.stripeEnabled && (opts.balance ?? 0) > 0 ? "button" : "hidden";
}
