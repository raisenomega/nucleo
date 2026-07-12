import { useState } from "react";
import type { IOrdersRepository, OrderStatus, Result } from "@orders/domain/order.types";

// Mutaciones de una orden: cambiar estado (con nota) + confirmar cobro (income+invoice+lead).
export function useOrderActions(repo: IOrdersRepository) {
  const [busy, setBusy] = useState(false);
  async function changeStatus(id: string, status: OrderStatus, note: string): Promise<Result> {
    setBusy(true); const r = await repo.changeStatus(id, status, note); setBusy(false); return r;
  }
  async function confirm(id: string, paymentMethodId: string | null, createInvoice: boolean, note = ""): Promise<Result> {
    setBusy(true); const r = await repo.confirm(id, paymentMethodId, createInvoice, note); setBusy(false); return r;
  }
  async function reportNotReceived(id: string, reason: string): Promise<Result> {
    setBusy(true); const r = await repo.reportNotReceived(id, reason); setBusy(false); return r;
  }
  return { busy, changeStatus, confirm, reportNotReceived };
}
