import { useCallback, useEffect, useState } from "react";
import { listPayments, recordPayment, voidPayment, type InvoicePayment, type RecordPayment } from "@billing/infrastructure/invoice-payments.repository";

// Carga los pagos de una factura y expone registrar/anular (devuelven mensaje de error o null).
export function useInvoicePayments(invoiceId: string) {
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const refresh = useCallback(() => { void listPayments(invoiceId).then(setPayments); }, [invoiceId]);
  useEffect(refresh, [refresh]);
  return {
    payments, refresh,
    record: async (p: RecordPayment) => { const e = await recordPayment(p); if (!e) refresh(); return e; },
    void: async (id: string, reason: string) => { const e = await voidPayment(id, reason); if (!e) refresh(); return e; },
  };
}
