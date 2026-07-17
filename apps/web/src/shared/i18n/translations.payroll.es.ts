import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (nómina avanzada). Se fusiona en translations.ts.
export const esPayroll = {
  contractor: "Contratista", grossSalary: "Salario bruto", netSalary: "Cheque neto",
  withheld: "Retenido", employerCost: "Costo patronal", totalWithheld: "Total retenido",
  totalEmployerCost: "Costo total empresa", employeeDeductions: "Retenciones (del cheque)",
  employerContributions: "Contribuciones patronales", remitToTreasury: "Remitir a Hacienda",
  contractorReceives: "El contratista recibe",
  payrollDisclaimer: "Cálculos estimados según las tasas configuradas. NO sustituyen el cálculo oficial de un especialista en nómina o CPA. Consulte a su profesional contable.",
  workerTypeLabel: "Tipo de trabajador",
  workerHelper: "Ayudante del día",
  workerSpeaker: "Orador/capacitador",
  workerConsultant: "Consultor externo",
  workerTechnician: "Servicio técnico",
  workerFreelancer: "Freelancer",
  externalWorkers: "Trabajadores externos",
  newExternalWorker: "Nuevo trabajador externo",
  contactInfo: "Contacto",
  beneficiary: "Beneficiario",
  internalStaff: "Personal interno",
  noExternalWorkers: "Aún no hay trabajadores externos",
} satisfies Partial<Record<TranslationKey, string>>;
