import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import type { OrderItem } from "@orders-public/presentation/OrderModal";

export interface Totals { subtotal: number; tax: number; shipping: number; total: number; discount: number; unitPrice: number | null; unitLabelEs: string | null; unitLabelEn: string | null }
type Step = { rule?: string; unit_price?: number; unit_label_es?: string; unit_label_en?: string };

// Preview de precio SERVER-autoritativo (debounce 200ms). Llama _public_preview_price = misma función que el submit
// → client_total == server_total (sin mismatch). Anon-safe: las pricing_rules son CEO-only, no legibles directo.
// Expone unit_price del step matrix_1d (par-based) para la leyenda unitaria del resumen.
export function useOrderPricing(item: OrderItem, values: Record<string, unknown>, coupon: string | null): Totals {
  const [totals, setTotals] = useState<Totals>({ subtotal: item.basePrice, tax: 0, shipping: 0, total: item.basePrice, discount: 0, unitPrice: null, unitLabelEs: null, unitLabelEn: null });
  const key = JSON.stringify({ id: item.id, values, coupon });
  useEffect(() => {
    const h = setTimeout(() => {
      void supabase.rpc("_public_preview_price", { _hostname: window.location.hostname,
        _items: [{ kind: item.kind, id: item.id, qty: 1 }], _cf: values, _coupon: coupon ?? undefined })
        .then(({ data }) => {
          const d = data as { subtotal: number; tax: number; shipping: number; total: number; discount?: number; breakdown?: { steps?: Step[] } } | null;
          if (!d) return;
          const st = d.breakdown?.steps?.find((s) => s.rule === "matrix_1d");
          setTotals({ subtotal: Number(d.subtotal) || 0, tax: Number(d.tax) || 0, shipping: Number(d.shipping) || 0, total: Number(d.total) || 0, discount: Number(d.discount) || 0,
            unitPrice: st?.unit_price != null ? Number(st.unit_price) : null, unitLabelEs: st?.unit_label_es ?? null, unitLabelEn: st?.unit_label_en ?? null });
        });
    }, 200);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return totals;
}
