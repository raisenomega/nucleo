import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@shared/lib/supabase";

// V8: si la cotización convertida generó un Sales Order (flujo fulfillment), muestra el link "→ SO-xxx".
// Si no hay SO (flujo clásico → factura), no renderiza nada.
export function QuoteConversionLink({ quoteId }: { quoteId: string }) {
  const [so, setSo] = useState<string | null>(null);
  useEffect(() => {
    void supabase.from("sales_orders").select("order_number").eq("quote_id", quoteId).limit(1).maybeSingle()
      .then(({ data }) => setSo((data as { order_number: string } | null)?.order_number ?? null));
  }, [quoteId]);
  if (!so) return null;
  return <Link to="/sales-orders" className="inline-flex items-center gap-1 text-xs font-bold text-primary"><ShoppingCart className="h-3 w-3" />→ {so}</Link>;
}
