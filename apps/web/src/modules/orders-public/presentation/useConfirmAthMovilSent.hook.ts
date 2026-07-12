import { useState } from "react";
import { ordersPublicRepository } from "@orders-public/infrastructure/orders-public.repository";

export function useConfirmAthMovilSent() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function confirm(orderId: string): Promise<void> {
    setBusy(true);
    const ok = await ordersPublicRepository.confirmAthSent(orderId);
    setBusy(false);
    if (ok) setDone(true);
  }
  return { busy, done, confirm };
}
