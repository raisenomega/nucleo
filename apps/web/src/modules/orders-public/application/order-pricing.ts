import type { OrderItemInput, PricingRules } from "@orders-public/domain/order-form.types";

// Espejo client-side de _public_price_order (server autoritativo). El server revalida; esto es solo el preview.
// itemBasePrice: precio de catálogo por item (product/service flat). La matriz reemplaza el precio del service.
export function computeTotal(
  items: OrderItemInput[], cf: Record<string, unknown>, rules: PricingRules, basePriceOf: (it: OrderItemInput) => number,
): { subtotal: number; tax: number; shipping: number; total: number } {
  const num = (v: unknown) => Number(v) || 0;
  const freq = typeof cf.frequency === "string" ? cf.frequency : "";
  let base = 0;
  for (const it of items) {
    if (it.kind === "service" && freq && rules.matrix) {
      const fi = rules.matrix.freqs.indexOf(freq);
      const bi = rules.matrix.bins.indexOf(num(cf.extraBuriedBins));
      base += fi >= 0 && bi >= 0 ? (rules.matrix.grid[fi]?.[bi] ?? 0) : 0;
    } else {
      base += basePriceOf(it) * (it.qty || 1);
    }
  }
  if (rules.addons) {
    base += num(cf.extraLids) * rules.addons.extraLids
      + num(cf.extraRegularBins) * rules.addons.extraRegularBins
      + (cf.hydroJet === true ? rules.addons.hydroJet : 0);
  }
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const tax = round2(base * rules.taxPct / 100);
  return { subtotal: round2(base), tax, shipping: rules.shipping, total: round2(base + tax + rules.shipping) };
}
