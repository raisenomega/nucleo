// BC fieldops — tipos de dominio del catálogo de inventario. Puro: sin imports externos.
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export interface InventoryItem {
  readonly id: string; readonly tenantId: string; readonly name: string;
  readonly stock: number; readonly unitCost: number; readonly minStock: number;
  readonly sku: string; readonly avgCost: number;
  readonly supplierName: string; readonly supplierId: string | null;
  readonly landingProductId: string | null; readonly lastRestockDate: string | null;
  readonly warehouseZone: string; readonly aisle: string;
  readonly shelf: string; readonly bin: string;
  readonly reorderPoint: number | null; readonly reorderQty: number | null;
  readonly photoUrls: readonly string[];
  readonly categoryId: string | null; readonly categoryName: string | null;
  readonly unitOfMeasureId: string | null; readonly unitOfMeasureAbbreviation: string | null; readonly unitOfMeasureName: string | null;
  readonly barcode: string | null;
  readonly trackingType: "none" | "lot" | "serial";
  readonly warehouseStock: readonly WarehouseStockEntry[];
}

// Saldo de un ítem en un almacén concreto (join a inventory_stock). La ubicación vive aquí, por almacén.
export interface WarehouseStockEntry {
  readonly warehouseId: string; readonly warehouseName: string; readonly warehouseCode: string; readonly quantity: number;
  readonly minStock: number | null; readonly reorderPoint: number | null; readonly reorderQty: number | null;
  readonly locationZone: string | null; readonly locationAisle: string | null; readonly locationShelf: string | null; readonly locationBin: string | null;
}

// Transferencia REAL entre almacenes (overload de 5-arg del backend).
export interface TransferData { readonly qty: number; readonly fromWarehouseId: string; readonly toWarehouseId: string; readonly notes: string; readonly lotTransfers?: readonly { readonly lotId: string; readonly qty: number }[]; }

export interface InventoryFormData {
  readonly name: string; readonly sku: string; readonly stock: number; readonly unitCost: number; readonly minStock: number;
  readonly landingProductId: string | null; readonly supplierId: string | null;
  readonly warehouseZone: string; readonly aisle: string; readonly shelf: string; readonly bin: string;
  readonly reorderPoint: number | null; readonly reorderQty: number | null;
  readonly categoryId: string | null; readonly unitOfMeasureId: string | null; readonly barcode: string | null; readonly trackingType: "none" | "lot" | "serial";
}

export interface RestockData {
  readonly quantity: number; readonly unitCost: number; readonly supplier: string; readonly supplierId: string | null;
  readonly notes: string; readonly date: string; readonly warehouseId: string | null;
  readonly lotNumber: string | null; readonly expiryDate: string | null; readonly manufactureDate: string | null;
}

export interface LandingProductRef { readonly id: string; readonly name: string; }

export type InventoryListResult = Result<InventoryItem[], string>;

export interface InventoryMovement {
  readonly id: string; readonly type: string; readonly quantity: number; readonly delta: number; readonly unitCost: number | null; readonly runningBalance: number;
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
  adjust(itemId: string, newQty: number, reason: string, warehouseId?: string | null, lotId?: string | null): Promise<Result<string | null, string>>;
  shrink(itemId: string, qty: number, reason: string, warehouseId?: string | null, lotId?: string | null): Promise<Result<string | null, string>>;
  transfer(itemId: string, data: TransferData): Promise<Result<string | null, string>>;
  listMovements(itemId: string): Promise<InventoryMovement[]>;
  listLandingProducts(): Promise<LandingProductRef[]>;
  findByBarcode(barcode: string): Promise<InventoryItem | null>;
}
