import type { SourceType, EntryStatus } from "@accounting/domain/journal-entry.types";
import type { TranslationKey } from "@shared/i18n";

// Badge por tipo de origen del asiento (color + etiqueta i18n).
export const SOURCE_META: Record<SourceType, { key: TranslationKey; cls: string }> = {
  expense: { key: "sExpense", cls: "bg-orange-500/10 text-orange-600" },
  income: { key: "sIncome", cls: "bg-green-500/10 text-green-600" },
  invoice: { key: "sInvoice", cls: "bg-blue-500/10 text-blue-600" },
  invoice_payment: { key: "sInvoicePayment", cls: "bg-cyan-500/10 text-cyan-600" },
  payroll: { key: "sPayroll", cls: "bg-purple-500/10 text-purple-600" },
  inventory: { key: "sInventory", cls: "bg-teal-500/10 text-teal-600" },
  bank: { key: "sBank", cls: "bg-secondary text-muted-foreground" },
  adjustment: { key: "sAdjustment", cls: "bg-secondary text-muted-foreground" },
  closing: { key: "sClosing", cls: "bg-secondary text-muted-foreground" },
  opening: { key: "sOpening", cls: "bg-secondary text-muted-foreground" },
};

export const STATUS_META: Record<EntryStatus, { key: TranslationKey; cls: string }> = {
  posted: { key: "stPosted", cls: "bg-green-500/10 text-green-600" },
  draft: { key: "stDraft", cls: "bg-amber-500/10 text-amber-600" },
  voided: { key: "stVoided", cls: "bg-destructive/10 text-destructive line-through" },
};

export const SOURCE_TYPES: SourceType[] = ["expense", "income", "invoice", "invoice_payment", "payroll", "inventory", "adjustment"];
export const STATUSES: EntryStatus[] = ["posted", "draft", "voided"];
