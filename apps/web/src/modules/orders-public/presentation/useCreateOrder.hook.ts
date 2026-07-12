import { useState } from "react";
import { ordersPublicRepository } from "@orders-public/infrastructure/orders-public.repository";
import type { CreateOrderInput, OrderResult } from "@orders-public/domain/order-form.types";

// Mutation de creación de orden. Debounce 3s implícito (busy bloquea el botón).
export function useCreateOrder() {
  const [busy, setBusy] = useState(false);
  async function submit(input: CreateOrderInput): Promise<OrderResult> {
    setBusy(true);
    try {
      const d = await ordersPublicRepository.create(input);
      if (!d) return { ok: false, code: "network" };
      if (d.status === "ok" && d.order_number) return { ok: true, orderNumber: d.order_number };
      return { ok: false, code: d.code ?? "network", errors: d.errors };
    } finally { setBusy(false); }
  }
  return { busy, submit };
}
