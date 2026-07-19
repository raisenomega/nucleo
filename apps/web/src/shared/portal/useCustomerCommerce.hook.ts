import { useCallback, useEffect, useState } from "react";
import { listOrders, listInvoices, confirmPayment, cancelOrder, reorder } from "@shared/portal/order.repository";
import type { CustomerOrder, CustomerInvoice } from "@shared/portal/order.types";

// Órdenes + facturas del cliente para el tenant, con acciones (confirmar pago / cancelar) que refrescan.
export function useCustomerCommerce(tenantId: string) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const refresh = useCallback(async () => { setOrders(await listOrders(tenantId)); setInvoices(await listInvoices(tenantId)); }, [tenantId]);
  useEffect(() => { void refresh(); }, [refresh]);
  const confirm = useCallback(async (id: string) => { const ok = await confirmPayment(id); if (ok) await refresh(); return ok; }, [refresh]);
  const cancel = useCallback(async (id: string) => { const ok = await cancelOrder(id); if (ok) await refresh(); return ok; }, [refresh]);
  const reorderOrder = useCallback(async (id: string) => { const ok = await reorder(id); if (ok) await refresh(); return ok; }, [refresh]);
  return { orders, invoices, refresh, confirm, cancel, reorder: reorderOrder };
}
