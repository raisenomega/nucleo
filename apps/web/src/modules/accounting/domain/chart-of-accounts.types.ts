// BC accounting — plan de cuentas (chart of accounts). Puro: sin imports externos.
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense" | "cogs";
export type NormalBalance = "debit" | "credit";

export interface ChartAccount {
  readonly id: string;
  readonly tenantId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountType: AccountType;
  readonly parentId: string | null;
  readonly parentName: string | null;
  readonly isHeader: boolean;
  readonly normalBalance: NormalBalance;
  readonly isSystem: boolean;
  readonly description: string | null;
  readonly active: boolean;
  readonly children?: readonly ChartAccount[];
}

export interface AccountFormData {
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountType: AccountType;
  readonly parentId: string | null;
  readonly isHeader: boolean;
  readonly description: string | null;
}

// debit-normal: asset/expense/cogs · credit-normal: liability/equity/revenue
export const NORMAL_BALANCE: Record<AccountType, NormalBalance> = {
  asset: "debit", expense: "debit", cogs: "debit", liability: "credit", equity: "credit", revenue: "credit",
};

export interface IChartOfAccountsRepository {
  list(): Promise<ChartAccount[]>;
  create(data: AccountFormData): Promise<Result<ChartAccount, string>>;
  update(id: string, data: Partial<AccountFormData>): Promise<Result<ChartAccount, string>>;
  toggleActive(id: string, active: boolean): Promise<Result<null, string>>;
}
