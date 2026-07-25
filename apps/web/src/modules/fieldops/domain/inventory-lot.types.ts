// BC fieldops — lotes / serie / caducidad. Capa de trazabilidad opcional (tracking_type del ítem).
import type { Result } from "@fieldops/domain/inventory.types";

export type LotStatus = "available" | "quarantine" | "expired" | "consumed" | "recalled";

export interface InventoryLot {
  readonly id: string; readonly itemId: string; readonly warehouseId: string; readonly warehouseName: string;
  readonly lotNumber: string; readonly lotType: "lot" | "serial"; readonly quantity: number;
  readonly expiryDate: string | null; readonly manufactureDate: string | null; readonly receivedDate: string | null;
  readonly supplierId: string | null; readonly supplierName: string | null; readonly unitCost: number | null;
  readonly status: LotStatus; readonly notes: string | null; readonly createdAt: string;
}

export interface IInventoryLotRepository {
  listByItem(itemId: string): Promise<InventoryLot[]>;
  listExpiring(daysAhead: number): Promise<InventoryLot[]>;
  updateStatus(lotId: string, status: LotStatus): Promise<Result<null, string>>;
  expireAll(): Promise<number>;
}
