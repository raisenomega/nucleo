// BC fieldops — órdenes de compra de inventario. Puro.
import type { Result } from "@fieldops/domain/inventory.types";

export type POStatus = "draft" | "ordered" | "partial" | "received" | "cancelled";

export interface POItem {
  readonly id: string; readonly itemId: string; readonly itemName: string;
  readonly quantity: number; readonly unitCost: number; readonly receivedQty: number;
}
export interface PurchaseOrder {
  readonly id: string; readonly orderNumber: number; readonly supplierId: string | null; readonly supplierName: string;
  readonly status: POStatus; readonly expectedAt: string | null; readonly receivedAt: string | null;
  readonly totalCost: number; readonly notes: string; readonly items: readonly POItem[];
}
export interface POLine { readonly itemId: string; readonly quantity: number; readonly unitCost: number; }
export interface POCreateData { readonly supplierId: string | null; readonly expectedAt: string; readonly notes: string; readonly lines: readonly POLine[]; readonly markOrdered: boolean; }
export interface ReorderSuggestion { readonly itemId: string; readonly name: string; readonly stock: number; readonly reorderPoint: number; readonly reorderQty: number; readonly supplierId: string | null; readonly supplierName: string; readonly unitCost: number; }

export interface IPurchaseOrderRepository {
  list(): Promise<Result<PurchaseOrder[], string>>;
  create(data: POCreateData): Promise<Result<string, string>>;
  setStatus(id: string, status: POStatus): Promise<Result<null, string>>;
  receive(id: string, items: { itemId: string; receivedQty: number }[]): Promise<Result<null, string>>;
  suggestions(): Promise<ReorderSuggestion[]>;
}
