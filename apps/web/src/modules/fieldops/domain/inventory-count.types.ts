// BC fieldops — conteo cíclico / inventario físico. Proceso: crear → contar (blind) → aprobar → aplicar.
import type { Result } from "@fieldops/domain/inventory.types";

export type CountStatus = "draft" | "in_progress" | "completed" | "approved" | "applied" | "cancelled";
export type CountType = "full" | "partial" | "category" | "low_stock";
export type LineStatus = "pending" | "counted" | "approved" | "rejected" | "applied";

export interface InventoryCountLine {
  readonly id: string; readonly itemId: string; readonly itemName: string; readonly itemSku: string;
  readonly expectedQty: number; readonly countedQty: number | null;
  readonly variance: number | null; readonly variancePct: number | null;
  readonly unitCostAtCount: number | null; readonly lineStatus: LineStatus;
  readonly countedByName: string | null; readonly countedAt: string | null; readonly notes: string | null;
}

export interface InventoryCount {
  readonly id: string; readonly countNumber: string; readonly status: CountStatus; readonly countType: CountType;
  readonly categoryId: string | null; readonly assignedTo: string | null; readonly assignedToName: string | null;
  readonly notes: string | null; readonly blindCount: boolean; readonly createdByName: string | null; readonly createdAt: string;
  readonly startedAt: string | null; readonly completedAt: string | null; readonly approvedAt: string | null; readonly appliedAt: string | null;
  readonly totalLines: number; readonly countedLines: number; readonly varianceLines: number;
  readonly warehouseId: string | null; readonly warehouseName: string | null;
  readonly lines?: readonly InventoryCountLine[];
}

export interface CountFormData {
  readonly countType: CountType; readonly categoryId: string | null; readonly assignedTo: string | null;
  readonly blindCount: boolean; readonly notes: string; readonly itemIds: string[]; readonly warehouseId: string | null;
}

export interface IInventoryCountRepository {
  list(): Promise<Result<InventoryCount[], string>>;
  getById(id: string): Promise<InventoryCount | null>;
  create(d: CountFormData): Promise<Result<string, string>>;
  recordLine(lineId: string, countedQty: number, notes?: string): Promise<Result<null, string>>;
  approveLines(countId: string, lineIds: string[], action: "approve" | "reject"): Promise<Result<null, string>>;
  apply(countId: string): Promise<Result<null, string>>;
  cancel(countId: string): Promise<Result<null, string>>;
}
