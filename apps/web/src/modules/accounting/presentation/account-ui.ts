import type { AccountType } from "@accounting/domain/chart-of-accounts.types";
import type { TranslationKey } from "@shared/i18n";

// Color-coding por tipo de cuenta (badges). Clases de paleta Tailwind (no literales hex).
export const TYPE_META: Record<AccountType, { key: TranslationKey; cls: string }> = {
  asset: { key: "asset", cls: "bg-blue-500/10 text-blue-600" },
  liability: { key: "liability", cls: "bg-red-500/10 text-red-600" },
  equity: { key: "equity", cls: "bg-purple-500/10 text-purple-600" },
  revenue: { key: "revenue", cls: "bg-green-500/10 text-green-600" },
  expense: { key: "expense", cls: "bg-orange-500/10 text-orange-600" },
  cogs: { key: "cogs", cls: "bg-amber-600/10 text-amber-700" },
};

export const ACCOUNT_TYPES: AccountType[] = ["asset", "liability", "equity", "revenue", "cogs", "expense"];
// Rango de código sugerido por tipo (para el hint del form).
export const CODE_HINT: Record<AccountType, string> = {
  asset: "1xxx", liability: "2xxx", equity: "3xxx", revenue: "4xxx", cogs: "5xxx", expense: "6xxx / 7xxx",
};
