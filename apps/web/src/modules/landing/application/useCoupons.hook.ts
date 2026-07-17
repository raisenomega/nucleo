import { useCallback, useEffect, useState } from "react";
import { useSession } from "@shared/providers/SessionProvider";
import type { ICouponRepository, Coupon, CouponDraft } from "@landing/domain/coupon.types";

// DI del repo. Carga cupones del tenant + mutaciones que refrescan. El tenant sale de la sesión (insert lo requiere).
export function useCoupons(repo: ICouponRepository) {
  const { session } = useSession();
  const [coupons, setCoupons] = useState<readonly Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setCoupons(await repo.list()); setLoading(false); }, [repo]);
  useEffect(() => { void refresh(); }, [refresh]);
  const save = useCallback(async (id: string | null, d: CouponDraft) => {
    if (!session?.tenantId) return { ok: false as const, error: "no-tenant" };
    const r = await repo.save(session.tenantId, id, d); if (r.ok) await refresh(); return r;
  }, [repo, refresh, session?.tenantId]);
  const remove = useCallback(async (id: string) => { const r = await repo.remove(id); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  return { coupons, loading, save, remove };
}
