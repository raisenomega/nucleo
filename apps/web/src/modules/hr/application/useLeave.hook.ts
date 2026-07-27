import { useCallback, useEffect, useState } from "react";
import type { ILeaveRepository, LeaveType, LeaveBalance, LeaveRequest, LeaveRequestData } from "@hr/domain/leave.types";

// DI del repo. Vacaciones del viewer. Si isStaff: balances de todos + solicitudes pendientes del equipo.
export function useLeave(repo: ILeaveRepository, userId: string, isStaff: boolean) {
  const year = new Date().getFullYear();
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [pending, setPending] = useState<LeaveRequest[]>([]);
  const load = useCallback(async () => {
    const [t, b, r, p] = await Promise.all([repo.getTypes(), repo.getBalances(isStaff ? null : userId, year),
      repo.getRequests(userId, null), isStaff ? repo.getRequests(null, "pending") : Promise.resolve([] as LeaveRequest[])]);
    setTypes(t); setBalances(b); setRequests(r); setPending(p);
  }, [repo, userId, isStaff, year]);
  useEffect(() => { if (userId) void load(); }, [load, userId]);
  const requestLeave = useCallback(async (d: LeaveRequestData) => { const r = await repo.requestLeave(d); if (r.ok) await load(); return r; }, [repo, load]);
  const approve = useCallback(async (id: string) => { const r = await repo.approve(id); if (r.ok) await load(); return r; }, [repo, load]);
  const reject = useCallback(async (id: string, reason: string) => { const r = await repo.reject(id, reason); if (r.ok) await load(); return r; }, [repo, load]);
  const cancel = useCallback(async (id: string) => { const r = await repo.cancel(id); if (r.ok) await load(); return r; }, [repo, load]);
  return { types, balances, requests, pending, year, refresh: load, requestLeave, approve, reject, cancel };
}
