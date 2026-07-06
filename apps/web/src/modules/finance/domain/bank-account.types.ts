// BC finance — cuenta de banco (entidad) + puerto del repositorio. Puro: sin imports externos.
export type AccountType = "checking" | "savings";

export interface BankAccount {
  readonly id: string;
  readonly tenantId: string;
  readonly bankName: string;
  readonly accountLast4: string;
  readonly accountType: AccountType;
  readonly isPrimary: boolean;
  readonly active: boolean;
}

export interface BankAccountFormData {
  readonly bankName: string;
  readonly accountLast4: string;
  readonly accountType: AccountType;
  readonly isPrimary: boolean;
}

export type RepoResult = { readonly ok: true } | { readonly ok: false; readonly error: string };

// Puerto CRUD — lo implementa infrastructure, lo consume application (DI).
export interface IBankAccountRepository {
  list(): Promise<readonly BankAccount[]>;
  create(d: BankAccountFormData): Promise<RepoResult>;
  update(id: string, d: BankAccountFormData): Promise<RepoResult>;
  remove(id: string): Promise<RepoResult>;
}
