import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (expediente del empleado). Se fusiona en translations.ts.
export const esEmployee = {
  middleName: "Segundo nombre", lastName: "Apellidos", ssn: "Seguro Social", dateOfBirth: "Fecha de nacimiento",
  gender: "Género", maritalStatus: "Estado civil", dependents: "Dependientes", alternatePhone: "Teléfono alterno",
  personalEmail: "Email personal", addressLine1: "Dirección 1", addressLine2: "Dirección 2", stateProvince: "Estado/Provincia",
  emergencyContact: "Contacto de emergencia", relationship: "Relación", professionalInfo: "Información profesional",
  department: "Departamento", employeeNumber: "Nº de empleado", hireDate: "Fecha de inicio", terminationDate: "Fecha de terminación",
  probationEnd: "Fin de probatorio", contractType: "Tipo de contrato", flsaClass: "Clasificación FLSA",
  riskClass: "Clasificación de riesgo", payFrequency: "Frecuencia de pago", professionalNotes: "Notas profesionales",
  country: "País",
  vacationRate: "Vacaciones (días/mes)", accrued: "Acumuladas", used: "Usadas", available: "Disponibles",
  maxAccrual: "Máx acumulable", sickRate: "Enfermedad (días/mes)", bonus: "Aguinaldo aplica", bonusPct: "Aguinaldo %",
  medicalPlan: "Plan médico", provider: "Proveedor", policyNumber: "Nº póliza", employeeContribution: "Aporte empleado",
  employerContribution: "Aporte patrono", retirementPlan: "Plan de retiro", planType: "Tipo", employerMatchPct: "Match patrono %",
  lifeInsurance: "Seguro de vida", parking: "Estacionamiento", companyVehicle: "Vehículo asignado",
  companyPhone: "Teléfono corporativo", otherBenefits: "Otros beneficios",
} satisfies Partial<Record<TranslationKey, string>>;
