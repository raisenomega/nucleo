import { supabase } from "@shared/lib/supabase";
import { slugify } from "@shared/lib/slugify";
import type { IReservableServicesRepository, ReservableService, ServiceInput, Result } from "@agenda/domain/reservable-service.types";

const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });
interface Row { id: string; name: string; duration_estimate_minutes: number | null; reserve_type: string | null; reserve_price: number | string | null; }
const toSvc = (r: Row): ReservableService => ({ id: r.id, name: r.name, durationMinutes: r.duration_estimate_minutes, reserveType: r.reserve_type ?? "none", reservePrice: r.reserve_price != null ? Number(r.reserve_price) : null });

export const supabaseReservableServicesRepository: IReservableServicesRepository = {
  async list() {
    const { data } = await supabase.from("tenant_landing_services").select("id,name,duration_estimate_minutes,reserve_type,reserve_price").eq("requires_scheduling", true).order("name");
    return ((data ?? []) as Row[]).map(toSvc);
  },
  async update(id, reserveType, reservePrice) {
    return ok((await supabase.from("tenant_landing_services").update({ reserve_type: reserveType, reserve_price: reservePrice }).eq("id", id)).error);
  },
  async create(tenantId, i) {
    const slug = `${slugify(i.name)}-${Date.now().toString(36).slice(-4)}`;
    const { data } = await supabase.from("tenant_landing_services")
      .insert({ tenant_id: tenantId, slug, name: i.name, duration_estimate_minutes: i.durationMinutes, price: i.price, pricing_type: "quote_required", requires_scheduling: i.requiresScheduling })
      .select("id,name,duration_estimate_minutes,reserve_type,reserve_price").single();
    return data ? toSvc(data as Row) : null;
  },
};
