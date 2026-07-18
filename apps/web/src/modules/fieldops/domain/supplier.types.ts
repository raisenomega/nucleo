// BC fieldops — proveedores de inventario. Puro.
import type { Result } from "@fieldops/domain/inventory.types";

export interface Supplier {
  readonly id: string;
  readonly name: string;
  readonly contactName: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly leadTimeDays: number | null;
  readonly paymentTerms: string;
  readonly notes: string;
  readonly active: boolean;
}

export type SupplierFormData = Omit<Supplier, "id">;
export interface SupplierRef { readonly id: string; readonly name: string; }
export type SupplierListResult = Result<Supplier[], string>;

export interface ISupplierRepository {
  list(): Promise<SupplierListResult>;
  create(data: SupplierFormData): Promise<Result<Supplier, string>>;
  update(id: string, data: SupplierFormData): Promise<Result<Supplier, string>>;
  remove(id: string): Promise<Result<null, string>>;
}
