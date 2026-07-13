import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import type { OrderItem } from "@orders-public/presentation/OrderModal";

export interface Totals { subtotal: number; tax: number; shipping: number; total: number }

// Preview de precio SERVER-autoritativo (debounce 200ms). Llama _public_preview_price = misma función que el submit
// → client_total == server_total (sin mismatch). Anon-safe: las pricing_rules son CEO-only, no legibles directo.
export function useOrderPricing(item: OrderItem, values: Record<string, unknown>, coupon: string | null): Totals {
  const [totals, setTotals] = useState<Totals>({ subtotal: item.basePrice, tax: 0, shipping: 0, total: item.basePrice });
  const key = JSON.stringify({ id: item.id, values, coupon });
  useEffect(() => {
    const h = setTimeout(() => {
      void supabase.rpc("_public_preview_price", { _hostname: window.location.hostname,
        _items: [{ kind: item.kind, id: item.id, qty: 1 }], _cf: values, _coupon: coupon ?? undefined })
        .then(({ data }) => {
          const d = data as Record<string, number> | null;
          if (d) setTotals({ subtotal: Number(d.subtotal) || 0, tax: Number(d.tax) || 0, shipping: Number(d.shipping) || 0, total: Number(d.total) || 0 });
        });
    }, 200);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return totals;
}
