import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (employee record). Merged in translations.ts.
export const enEmployee = {
  middleName: "Middle name", lastName: "Last name", ssn: "SSN", dateOfBirth: "Date of birth",
  gender: "Gender", maritalStatus: "Marital status", dependents: "Dependents", alternatePhone: "Alternate phone",
  personalEmail: "Personal email", addressLine1: "Address 1", addressLine2: "Address 2", stateProvince: "State/Province",
  emergencyContact: "Emergency contact", relationship: "Relationship", professionalInfo: "Professional info",
  department: "Department", employeeNumber: "Employee no.", hireDate: "Hire date", terminationDate: "Termination date",
  probationEnd: "Probation end", contractType: "Contract type", flsaClass: "FLSA class",
  riskClass: "Risk class", payFrequency: "Pay frequency", professionalNotes: "Professional notes",
  country: "Country",
} satisfies Partial<Record<TranslationKey, string>>;
