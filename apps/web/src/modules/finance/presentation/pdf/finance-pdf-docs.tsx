import type { ReactElement } from "react";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { Income } from "@finance/domain/income.types";
import type { Expense } from "@finance/domain/expense.types";
import type { ExtraPayment } from "@finance/domain/extraordinary.types";
import type { PayslipData } from "@finance/presentation/pdf/PayslipPdf";

// Loaders: import DINÁMICO del componente (react-pdf fuera del bundle/SSR) + labels traducidos por el caller.
type T = (k: TranslationKey) => string;
const money = (n: number) => `$${n.toFixed(2)}`;
const opt = (cond: unknown, label: string, value: string) => (cond ? [{ label, value }] : []);

export async function incomeReceiptDoc(i: Income, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { ReceiptPdf } = await import("@finance/presentation/pdf/ReceiptPdf");
  const rows = [{ label: t("category"), value: i.categoryLabel }, { label: t("paymentMethod"), value: i.paymentMethodLabel },
    ...opt(i.clientReference, t("clientReference"), i.clientReference), ...opt(i.orderNumber, t("orderNumber"), i.orderNumber)];
  return <ReceiptPdf brand={brand} docTitle={t("docIncomeReceipt")} dateLine={i.date} rows={rows} amountLabel={t("amount")} amount={money(i.amount)} note={i.description || undefined} />;
}

export async function expenseReceiptDoc(e: Expense, paidByName: string, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { ReceiptPdf } = await import("@finance/presentation/pdf/ReceiptPdf");
  const rows = [{ label: t("category"), value: e.categoryLabel }, { label: t("paymentMethod"), value: e.paymentMethodLabel },
    ...opt(e.paidBy, t("paidBy"), paidByName)];
  return <ReceiptPdf brand={brand} docTitle={t("docExpenseReceipt")} dateLine={e.date} rows={rows} amountLabel={t("amount")} amount={money(e.amount)} note={e.description || undefined} />;
}

export async function extraordinaryReceiptDoc(x: ExtraPayment, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { ReceiptPdf } = await import("@finance/presentation/pdf/ReceiptPdf");
  const rows = [{ label: t("category"), value: x.categoryLabel }, { label: t("paymentMethod"), value: x.paymentMethodLabel }];
  return <ReceiptPdf brand={brand} docTitle={t("docExtraordinary")} dateLine={x.date} rows={rows} amountLabel={t("amount")}
    amount={money(x.amount)} section={{ title: t("justification"), body: x.justification }} />;
}

export async function payslipDoc(data: PayslipData, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { PayslipPdf } = await import("@finance/presentation/pdf/PayslipPdf");
  const labels = { title: t("payStub"), period: t("period"), employee: t("employee"), concept: t("concept"), amount: t("amount"),
    gross: t("grossSalary"), deductions: t("deductions"), net: t("netSalary"), regular: t("regularHours"), overtime: t("overtimeHours"),
    signature: t("signature"), disclaimer: t("payslipDisclaimer") };
  return <PayslipPdf brand={brand} data={data} labels={labels} />;
}
