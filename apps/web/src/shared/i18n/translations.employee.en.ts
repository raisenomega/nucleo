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
  vacationRate: "Vacation (days/mo)", accrued: "Accrued", used: "Used", available: "Available",
  maxAccrual: "Max accrual", sickRate: "Sick (days/mo)", bonus: "Bonus applies", bonusPct: "Bonus %",
  medicalPlan: "Medical plan", provider: "Provider", policyNumber: "Policy no.", employeeContribution: "Employee contrib.",
  employerContribution: "Employer contrib.", retirementPlan: "Retirement plan", planType: "Type", employerMatchPct: "Employer match %",
  lifeInsurance: "Life insurance", parking: "Parking", companyVehicle: "Company vehicle",
  companyPhone: "Company phone", otherBenefits: "Other benefits",
} satisfies Partial<Record<TranslationKey, string>>;
