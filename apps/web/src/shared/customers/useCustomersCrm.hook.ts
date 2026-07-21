import { useCallback, useEffect, useState } from "react";
import { fetchCustomers, fetchOrders, fetchReviews, fetchInvoices, createCustomer, updateCustomer, type CustomerPayload } from "@shared/customers/customer-crm.repository";
import { aggregate, type AdminCustomer, type CustomerKpis } from "@shared/customers/customers-agg";

// Carga clientes + agregados (órdenes/facturas/reviews) y los combina en filas + KPIs.
export function useCustomersCrm(tenantId: string) {
  const [rows, setRows] = useState<AdminCustomer[]>([]);
  const [kpis, setKpis] = useState<CustomerKpis>({ total: 0, active30: 0, totalBilled: 0, avgRating: 0 });
  const refresh = useCallback(async () => {
    const [c, o, rv, iv] = await Promise.all([fetchCustomers(tenantId), fetchOrders(tenantId), fetchReviews(tenantId), fetchInvoices(tenantId)]);
    const agg = aggregate(c, o, rv, iv, Date.now());
    setRows(agg.rows); setKpis(agg.kpis);
  }, [tenantId]);
  useEffect(() => { void refresh(); }, [refresh]);
  const create = useCallback(async (p: CustomerPayload) => { const e = await createCustomer(p); if (!e) await refresh(); return e; }, [refresh]);
  const update = useCallback(async (id: string, p: CustomerPayload) => { const e = await updateCustomer(id, p); if (!e) await refresh(); return e; }, [refresh]);
  return { rows, kpis, refresh, create, update };
}
