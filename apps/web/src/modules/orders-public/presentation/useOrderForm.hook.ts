import { useEffect, useState } from "react";
import { ordersPublicRepository } from "@orders-public/infrastructure/orders-public.repository";
import type { OrderForm, PaymentOption, PricingRules } from "@orders-public/domain/order-form.types";

// Carga el form que aplica al item + métodos de pago + reglas de pricing. FetchState simple (loading/ready/notfound).
export function useOrderForm(kind: string, itemId: string) {
  const [form, setForm] = useState<OrderForm | null>(null);
  const [methods, setMethods] = useState<PaymentOption[]>([]);
  const [rules, setRules] = useState<PricingRules | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");
  useEffect(() => {
    let live = true;
    void (async () => {
      const [f, m, r] = await Promise.all([
        ordersPublicRepository.resolveForm(kind, itemId), ordersPublicRepository.paymentMethods(), ordersPublicRepository.pricingRules(),
      ]);
      if (!live) return;
      setMethods(m); setRules(r);
      if (f) { setForm(f); setStatus("ready"); } else setStatus("notfound");
    })();
    return () => { live = false; };
  }, [kind, itemId]);
  return { form, methods, rules, status };
}
