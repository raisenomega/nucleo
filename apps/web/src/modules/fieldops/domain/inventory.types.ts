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
}

export interface InventoryFormData {
  readonly name: string;
  readonly stock: number;
  readonly unitCost: number;
  readonly minStock: number;
}

export type InventoryListResult = Result<InventoryItem[], string>;

// Puerto del repositorio — lo implementa infrastructure; lo consume application (DI).
export interface IInventoryRepository {
  list(): Promise<InventoryListResult>;
  create(data: InventoryFormData): Promise<Result<InventoryItem, string>>;
  update(id: string, data: InventoryFormData): Promise<Result<InventoryItem, string>>;
  remove(id: string): Promise<Result<null, string>>;
}
