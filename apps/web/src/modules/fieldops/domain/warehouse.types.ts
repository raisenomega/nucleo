// BC fieldops — almacenes. Multi-almacén real: inventory_items.stock = total; inventory_stock = saldo por almacén.
import type { Result } from "@fieldops/domain/inventory.types";

export interface Warehouse {
  readonly id: string; readonly tenantId: string; readonly name: string; readonly code: string;
  readonly address: string | null; readonly isDefault: boolean; readonly isActive: boolean; readonly notes: string | null; readonly createdAt: string;
}

export interface WarehouseFormData { readonly name: string; readonly code: string; readonly address: string; readonly notes: string; }

export interface WarehouseRef { readonly id: string; readonly name: string; readonly code: string; readonly isDefault: boolean; }

// Puerto — lo implementa infrastructure; lo consume application (DI).
export interface IWarehouseRepository {
  list(): Promise<Result<Warehouse[], string>>;
  create(d: WarehouseFormData): Promise<Result<Warehouse, string>>;
  update(id: string, d: WarehouseFormData): Promise<Result<Warehouse, string>>;
  remove(id: string): Promise<Result<null, string>>;
}
