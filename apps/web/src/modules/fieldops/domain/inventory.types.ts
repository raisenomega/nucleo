// BC fieldops — tipos de dominio del catálogo de inventario. Puro: sin imports externos.
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export interface InventoryItem {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly stock: number;
  readonly unitCost: number;
  readonly minStock: number;
  readonly sku: string;
  readonly avgCost: number;
  readonly supplierName: string;
  readonly landingProductId: string | null;
  readonly lastRestockDate: string | null;
}

export interface InventoryFormData {
  readonly name: string;
  readonly stock: number;
  readonly unitCost: number;
  readonly minStock: number;
  readonly landingProductId: string | null;
}

export interface RestockData {
  readonly quantity: number;
  readonly unitCost: number;
  readonly supplier: string;
  readonly notes: string;
  readonly date: string;
}

export interface LandingProductRef { readonly id: string; readonly name: string; }

export type InventoryListResult = Result<InventoryItem[], string>;

export interface InventoryMovement {
  readonly id: string; readonly type: string; readonly quantity: number;
  readonly date: string; readonly notes: string | null; readonly employee: string;
  readonly clientName: string | null; readonly serviceType: string | null; readonly routeDate: string | null;
}

// Puerto del repositorio — lo implementa infrastructure; lo consume application (DI).
export interface IInventoryRepository {
  list(): Promise<InventoryListResult>;
  create(data: InventoryFormData): Promise<Result<InventoryItem, string>>;
  update(id: string, data: InventoryFormData): Promise<Result<InventoryItem, string>>;
  remove(id: string): Promise<Result<null, string>>;
  restock(itemId: string, data: RestockData): Promise<Result<string | null, string>>;
  adjust(itemId: string, newQty: number, reason: string): Promise<Result<string | null, string>>;
  shrink(itemId: string, qty: number, reason: string): Promise<Result<string | null, string>>;
  listMovements(itemId: string): Promise<InventoryMovement[]>;
  listLandingProducts(): Promise<LandingProductRef[]>;
}
