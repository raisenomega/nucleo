// BC admin — tipos de gestión de equipo, categorías y settings. Puro.
export type AppRole = "superadmin" | "ceo" | "coo" | "operaciones" | "servicio";
export type UserStatus = "pending" | "approved" | "rejected";

export interface TeamMember {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: AppRole | null;
  readonly status: UserStatus;
}

export interface InviteData {
  readonly email: string; readonly fullName: string; readonly role: AppRole;
}

export interface CategoryConfig {
  readonly id: string; readonly kind: string; readonly label: string;
  readonly expenseClass: string | null; readonly active: boolean;
}

export interface SettingEntry { readonly key: string; readonly value: string; }

export type RepoResult = { readonly ok: true } | { readonly ok: false; readonly error: string };

// Puerto — lo implementa infrastructure; lo consume application (DI).
export interface IAdminRepository {
  listTeam(): Promise<readonly TeamMember[]>;
  setStatus(id: string, status: UserStatus): Promise<RepoResult>;
  changeRole(userId: string, role: AppRole): Promise<RepoResult>;
  invite(d: InviteData): Promise<RepoResult>;
  listCategories(): Promise<readonly CategoryConfig[]>;
  saveCategory(id: string | null, kind: string, label: string, expenseClass: string | null): Promise<RepoResult>;
  toggleCategory(id: string, active: boolean): Promise<RepoResult>;
  listSettings(): Promise<readonly SettingEntry[]>;
  upsertSetting(key: string, value: string): Promise<RepoResult>;
}
