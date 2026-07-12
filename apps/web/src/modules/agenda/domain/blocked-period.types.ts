import type { Result } from "@agenda/domain/appointment-settings.types";
export type { Result };

export interface BlockedPeriod { id: string; startsAt: string; endsAt: string; reason: string; isFullDay: boolean; }
export type BlockedPeriodInput = Omit<BlockedPeriod, "id">;
export interface IBlockedPeriodsRepository {
  list(): Promise<BlockedPeriod[]>;
  create(tenantId: string, input: BlockedPeriodInput): Promise<Result>;
  remove(id: string): Promise<Result>;
}
