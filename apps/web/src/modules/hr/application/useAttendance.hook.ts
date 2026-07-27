import { useCallback, useEffect, useState } from "react";
import type { IAttendanceRepository, AttendanceRecord } from "@hr/domain/attendance.types";

// DI del repo. Mi registro de asistencia activo; refresca cada 60s (por si auto-checkout o cambios).
export function useAttendance(repo: IAttendanceRepository, userId: string) {
  const [active, setActive] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!userId) return;
    setActive(await repo.getMyActive(userId)); setLoading(false);
  }, [repo, userId]);
  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 60000);
    return () => clearInterval(t);
  }, [refresh]);
  const clockIn = useCallback(async (lat: number | null, lng: number | null) => { const r = await repo.clockIn(lat, lng); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const clockOut = useCallback(async (lat: number | null, lng: number | null) => { const r = await repo.clockOut(lat, lng); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  return { active, loading, refresh, clockIn, clockOut };
}
