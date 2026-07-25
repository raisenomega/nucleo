import type { Result } from "@accounting/domain/chart-of-accounts.types";

// Estado del mapeo de una categoría de gasto/ingreso a su cuenta contable.
export interface CategoryMapping {
  readonly categoryId: string; readonly kind: "expense" | "income"; readonly label: string;
  readonly expenseClass: string | null; readonly accountId: string | null;
  readonly accountCode: string | null; readonly accountName: string | null;
  readonly resolvedCode: string; readonly isManual: boolean; readonly isCatchall: boolean;
}

export interface ICategoryMappingRepository {
  list(): Promise<CategoryMapping[]>;
  setAccount(categoryId: string, accountId: string | null): Promise<Result<null, string>>;
  autoMap(tenantId: string): Promise<Result<{ mapped: number; remaining: number }, string>>;
}
