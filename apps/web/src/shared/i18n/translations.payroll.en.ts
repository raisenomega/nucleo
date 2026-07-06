import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (advanced payroll). Merged in translations.ts.
export const enPayroll = {
  contractor: "Contractor", grossSalary: "Gross salary", netSalary: "Net pay",
  withheld: "Withheld", employerCost: "Employer cost", totalWithheld: "Total withheld",
  totalEmployerCost: "Total employer cost", employeeDeductions: "Withholdings (from pay)",
  employerContributions: "Employer contributions", remitToTreasury: "Remit to Treasury",
  contractorReceives: "Contractor receives",
  payrollDisclaimer: "Estimates based on configured rates. They DO NOT replace an official payroll calculation by a payroll specialist or CPA. Consult your tax professional.",
} satisfies Partial<Record<TranslationKey, string>>;
