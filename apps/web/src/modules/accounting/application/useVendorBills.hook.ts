import { useCallback, useEffect, useState } from "react";
import type { VendorBill, BillFormData, IVendorBillRepository } from "@accounting/domain/vendor-bill.types";

// DI del repo. Carga bills, expone el seleccionado (con líneas/pagos) y las mutaciones que refrescan.
export function useVendorBills(repo: IVendorBillRepository) {
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [selected, setSelected] = useState<VendorBill | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => { setBills(await repo.list()); setLoading(false); }, [repo]);
  useEffect(() => { void refresh(); }, [refresh]);

  const select = useCallback(async (id: string | null) => { setSelected(id ? await repo.getById(id) : null); }, [repo]);
  const reselect = useCallback(async (id: string) => { await refresh(); setSelected(await repo.getById(id)); }, [repo, refresh]);

  const create = useCallback(async (d: BillFormData) => { const r = await repo.create(d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const createFromPo = useCallback(async (poId: string, num: string, bd: string, dd: string) => { const r = await repo.createFromPo(poId, num, bd, dd); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const approve = useCallback(async (id: string) => { const r = await repo.approve(id); if (r.ok) await reselect(id); return r; }, [repo, reselect]);
  const recordPayment = useCallback(async (id: string, amt: number, date: string, m: string | null, ref: string | null, notes: string | null) => { const r = await repo.recordPayment(id, amt, date, m, ref, notes); if (r.ok) await reselect(id); return r; }, [repo, reselect]);
  const voidPayment = useCallback(async (billId: string, pid: string, reason: string) => { const r = await repo.voidPayment(pid, reason); if (r.ok) await reselect(billId); return r; }, [repo, reselect]);
  const voidBill = useCallback(async (id: string) => { const r = await repo.voidBill(id); if (r.ok) { await refresh(); setSelected(null); } return r; }, [repo, refresh]);

  return { bills, selected, loading, refresh, select, create, createFromPo, approve, recordPayment, voidPayment, voidBill };
}
