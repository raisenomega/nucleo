// BC accounting — libro mayor (asientos). Puro. READ-ONLY en esta fase (asientos auto).
export type EntryStatus = "draft" | "posted" | "voided";
export type SourceType = "expense" | "income" | "invoice" | "invoice_payment" | "payroll" | "inventory" | "bank" | "adjustment" | "closing" | "opening" | "vendor_bill" | "bill_payment";

export interface JournalEntryLine {
  readonly id: string; readonly accountId: string; readonly accountCode: string;
  readonly accountName: string; readonly accountType: string;
  readonly debit: number; readonly credit: number; readonly description: string | null;
}

export interface JournalEntry {
  readonly id: string; readonly entryNumber: string; readonly entryDate: string; readonly description: string;
  readonly entryType: "manual" | "auto"; readonly sourceType: SourceType | null; readonly sourceId: string | null;
  readonly status: EntryStatus; readonly periodYear: number; readonly periodMonth: number; readonly isClosingEntry: boolean;
  readonly lines: readonly JournalEntryLine[]; readonly totalDebit: number; readonly totalCredit: number;
  readonly voidReason: string | null; readonly postedAt: string | null; readonly createdAt: string;
}

export interface AccountBalance {
  readonly accountId: string; readonly accountCode: string; readonly accountName: string;
  readonly accountType: string; readonly normalBalance: string;
  readonly totalDebit: number; readonly totalCredit: number; readonly balance: number;
}

export interface JournalFilters {
  readonly periodYear: number; readonly periodMonth: number | null; readonly accountId: string | null;
  readonly sourceType: SourceType | null; readonly status: EntryStatus | null; readonly search: string;
}

export interface IJournalEntryRepository {
  list(filters: JournalFilters): Promise<JournalEntry[]>;
  trialBalance(year: number, month: number | null): Promise<AccountBalance[]>;
}
