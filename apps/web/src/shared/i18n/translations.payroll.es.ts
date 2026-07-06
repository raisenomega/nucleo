import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (nómina avanzada). Se fusiona en translations.ts.
export const esPayroll = {
  contractor: "Contratista", grossSalary: "Salario bruto", netSalary: "Cheque neto",
  withheld: "Retenido", employerCost: "Costo patronal", totalWithheld: "Total retenido",
  totalEmployerCost: "Costo total empresa", employeeDeductions: "Retenciones (del cheque)",
  employerContributions: "Contribuciones patronales", remitToTreasury: "Remitir a Hacienda",
  contractorReceives: "El contratista recibe",
  payrollDisclaimer: "Cálculos estimados según las tasas configuradas. NO sustituyen el cálculo oficial de un especialista en nómina o CPA. Consulte a su profesional contable.",
} satisfies Partial<Record<TranslationKey, string>>;
