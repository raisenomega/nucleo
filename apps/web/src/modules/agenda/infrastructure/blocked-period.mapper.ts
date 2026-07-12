import type { BlockedPeriod, BlockedPeriodInput } from "@agenda/domain/blocked-period.types";

export interface BlockedRow { id: string; starts_at: string; ends_at: string; reason: string | null; is_full_day: boolean; }
export const toBlocked = (r: BlockedRow): BlockedPeriod =>
  ({ id: r.id, startsAt: r.starts_at, endsAt: r.ends_at, reason: r.reason ?? "", isFullDay: r.is_full_day });
export const fromBlocked = (tenantId: string, i: BlockedPeriodInput) =>
  ({ tenant_id: tenantId, starts_at: i.startsAt, ends_at: i.endsAt, reason: i.reason || null, is_full_day: i.isFullDay });
