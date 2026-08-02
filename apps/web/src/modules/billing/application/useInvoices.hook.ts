import { useCallback, useEffect, useState } from "react";
import type { IInvoiceRepository, Invoice, InvoiceInput, InvoiceStatus, BillingSummary } from "@billing/domain/invoice.types";

const EMPTY: BillingSummary = { invoices_pending: 0, invoices_overdue: 0, orders_pending: 0, mrr: 0 };

export function useInvoices(repo: IInvoiceRepository) {
  const [list, setList] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<BillingSummary>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const [l, s] = await Promise.all([repo.list(), repo.summary()]);
    // EMPTY sigue siendo el valor de arranque; lo que ya no pasa es que un fallo se pinte como KPIs en cero.
    setList(l); setSummary(s.ok ? s.value : EMPTY); setError(s.ok ? null : s.error);
  }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const save = useCallback(async (d: InvoiceInput) => { const r = await repo.save(d); if (r.ok) await load(); return r; }, [repo, load]);
  const confirmPayment = useCallback(async (id: string) => { const r = await repo.confirmPayment(id); if (r.ok) await load(); return r; }, [repo, load]);
  const setStatus = useCallback(async (id: string, st: InvoiceStatus) => { const r = await repo.setStatus(id, st); if (r.ok) await load(); return r; }, [repo, load]);
  return { list, summary, error, save, confirmPayment, setStatus, fromLead: repo.fromLead, reload: load };
}
