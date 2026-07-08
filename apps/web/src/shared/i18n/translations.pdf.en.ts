import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (Gotenberg PDFs). Merged in translations.ts.
export const enPdf = {
  downloadPdf: "Download PDF", generatingPdf: "Generating PDF…", pdfReady: "PDF ready",
  pdfError: "Could not generate the PDF. Try again.", exportPdf: "Export PDF",
  fiscalReport: "Fiscal report", payslipPdf: "Payslip PDF",
} satisfies Partial<Record<TranslationKey, string>>;
