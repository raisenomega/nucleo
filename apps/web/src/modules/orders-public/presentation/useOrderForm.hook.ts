import { useEffect, useState } from "react";
import { ordersPublicRepository } from "@orders-public/infrastructure/orders-public.repository";
import type { OrderForm, PayConfig, PaymentOption, PricingRules } from "@orders-public/domain/order-form.types";

// Carga el form que aplica al item + métodos de pago + reglas de pricing + config de pago (Stripe). FetchState simple.
export function useOrderForm(kind: string, itemId: string) {
  const [form, setForm] = useState<OrderForm | null>(null);
  const [methods, setMethods] = useState<PaymentOption[]>([]);
  const [rules, setRules] = useState<PricingRules | null>(null);
  const [payConfig, setPayConfig] = useState<PayConfig | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");
  useEffect(() => {
    let live = true;
    void (async () => {
      const [f, m, r, pc] = await Promise.all([
        ordersPublicRepository.resolveForm(kind, itemId), ordersPublicRepository.paymentMethods(),
        ordersPublicRepository.pricingRules(), ordersPublicRepository.payConfig(),
      ]);
      if (!live) return;
      setMethods(m); setRules(r); setPayConfig(pc);
      if (f) { setForm(f); setStatus("ready"); } else setStatus("notfound");
    })();
    return () => { live = false; };
  }, [kind, itemId]);
  return { form, methods, rules, payConfig, status };
}
