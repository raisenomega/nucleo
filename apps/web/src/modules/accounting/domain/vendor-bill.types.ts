import type { Result } from "@accounting/domain/chart-of-accounts.types";

// BC accounting — Cuentas por Pagar (vendor bills). Puro: sin imports externos salvo Result.
export type BillStatus = "draft" | "pending" | "approved" | "partially_paid" | "paid" | "voided" | "disputed";

export interface VendorBillLine {
  readonly id: string; readonly description: string; readonly quantity: number; readonly unitPrice: number;
  readonly taxPct: number; readonly subtotal: number; readonly tax: number; readonly total: number;
  readonly itemId: string | null; readonly itemName: string | null; readonly poLineId: string | null;
  readonly categoryId: string | null; readonly accountId: string | null;
}
export interface VendorBillPayment {
  readonly id: string; readonly amount: number; readonly paymentDate: string; readonly paymentMethodName: string | null;
  readonly reference: string | null; readonly notes: string | null; readonly voidedAt: string | null; readonly createdAt: string;
}
export interface VendorBill {
  readonly id: string; readonly tenantId: string; readonly supplierId: string; readonly supplierName: string;
  readonly billNumber: string; readonly internalNumber: string; readonly billDate: string; readonly dueDate: string;
  readonly status: BillStatus; readonly subtotal: number; readonly taxAmount: number; readonly total: number;
  readonly amountPaid: number; readonly balance: number; readonly purchaseOrderId: string | null; readonly poNumber: string | null;
  readonly notes: string | null; readonly approvedAt: string | null; readonly approvedByName: string | null;
  readonly lines: readonly VendorBillLine[]; readonly payments: readonly VendorBillPayment[];
  readonly createdAt: string; readonly daysOverdue: number;
}
export interface BillLineInput { description: string; quantity: number; unitPrice: number; taxPct: number; itemId?: string; categoryId?: string; }
export interface BillFormData {
  supplierId: string; billNumber: string; billDate: string; dueDate: string;
  notes: string | null; purchaseOrderId: string | null; lines: BillLineInput[];
}
export interface ApAgingBucket {
  readonly supplierId: string; readonly supplierName: string; readonly current: number;
  readonly b1_30: number; readonly b31_60: number; readonly b61_90: number; readonly b90_plus: number; readonly total: number;
}
export interface IVendorBillRepository {
  list(): Promise<VendorBill[]>;
  getById(id: string): Promise<VendorBill | null>;
  create(data: BillFormData): Promise<Result<string, string>>;
  createFromPo(poId: string, billNumber: string, billDate: string, dueDate: string): Promise<Result<string, string>>;
  approve(id: string): Promise<Result<null, string>>;
  recordPayment(billId: string, amount: number, date: string, methodId: string | null, reference: string | null, notes: string | null): Promise<Result<null, string>>;
  voidPayment(paymentId: string, reason: string): Promise<Result<null, string>>;
  voidBill(id: string): Promise<Result<null, string>>;
}
