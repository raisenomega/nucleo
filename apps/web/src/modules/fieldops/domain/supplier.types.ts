// BC fieldops — proveedores de inventario (perfil completo: fiscal/pago/logística/redes/rating). Puro.
import type { Result } from "@fieldops/domain/inventory.types";

export interface Supplier {
  readonly id: string;
  readonly name: string; readonly description: string; readonly companyType: string;
  readonly primaryCategory: string; readonly secondaryCategories: readonly string[];
  readonly website: string; readonly catalogUrl: string;
  readonly contactName: string; readonly phone: string; readonly email: string; readonly whatsapp: string;
  readonly address: string; readonly city: string; readonly state: string; readonly zipCode: string; readonly country: string;
  readonly facebook: string; readonly instagram: string; readonly linkedin: string;
  readonly taxId: string; readonly taxExempt: boolean; readonly taxRate: number | null; readonly currency: string;
  readonly acceptedPayments: readonly string[]; readonly bankName: string; readonly bankAccount: string; readonly routingNumber: string;
  readonly paymentTerms: string; readonly creditLimit: number | null; readonly creditBalance: number | null;
  readonly leadTimeDays: number | null; readonly deliveryMethod: string; readonly minOrderAmount: number | null; readonly returnPolicy: string;
  readonly rating: number | null; readonly notes: string; readonly active: boolean;
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
