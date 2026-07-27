import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (Gotenberg PDFs). Merged in translations.ts.
export const enPdf = {
  downloadPdf: "Download PDF", generatingPdf: "Generating PDF…", pdfReady: "PDF ready",
  pdfError: "Could not generate the PDF. Try again.", exportPdf: "Export PDF",
  fiscalReport: "Fiscal report", payslipPdf: "Payslip PDF",
  receiptPdf: "Receipt PDF", inventoryReport: "Inventory report", debtsReport: "Debts report",
  certificatePdf: "Certificate PDF", routePdf: "Summary PDF",
  showing: "Showing", ofTotal: "of", prev: "Previous", next: "Next",
  from: "From", to: "To", generateReport: "Generate report",
  docIncomeReceipt: "INCOME RECEIPT", docExpenseReceipt: "EXPENSE VOUCHER", docExtraordinary: "EXTRAORDINARY PAYMENT",
  concept: "Concept", payslipDisclaimer: "Informational document — not a substitute for CPA advice. Calculations per the business's fiscal configuration (Puerto Rico).",
  docCertificate: "CERTIFICATE", certTitle: "TRAINING CERTIFICATE", certCertifies: "certifies that",
  certCompleted: "successfully completed the course", certAuthorized: "Authorized signature",
  evalDocTitle: "PERFORMANCE EVALUATION", evalProbation: "In probationary period", criterion: "Criterion", evalLegalTitle: "Requires legal validation (Act 80)",
} satisfies Partial<Record<TranslationKey, string>>;
