import type { TranslationKey } from "./translations.keys";

// Accounting (GL) module dictionary. Merged in translations.ts.
export const enAccounting = {
  accounting: "Accounting", chartOfAccounts: "Chart of accounts", generalLedger: "General ledger",
  accountCode: "Code", accountName: "Name", parentAccount: "Parent account",
  header: "Header", systemAccount: "System", postable: "postable", inactive: "Inactive",
  asset: "Asset", liability: "Liability", equity: "Equity", revenue: "Revenue", expense: "Expense", cogs: "COGS",
  createAccount: "New account", editAccount: "Edit account", inactiveAccounts: "Show inactive",
  activate: "Activate", expand: "Expand", collapse: "Collapse",
  doubleEntryAccounting: "Double-entry accounting", glEnabled: "Enabled", glDisabled: "Disabled",
  enableGLHint: "Enables the general ledger with automatic Dr/Cr entries. A standard chart of accounts will be created.",
  enableGLWarning: "Double-entry accounting will be activated. All new expenses, income, invoices and payroll will generate accounting entries automatically. Continue?",
  glEnabledMsg: "Accounting enabled. Transactions now generate journal entries.",
  glDisabledMsg: "Accounting disabled. Existing entries are kept.",
} satisfies Partial<Record<TranslationKey, string>>;
