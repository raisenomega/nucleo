// BC admin — expediente del empleado (employee_details, ~80 columnas). Puro.
// NOTA: campos snake_case a propósito (espejan la tabla) → repo sin mapeo de 80 campos.
import type { RepoResult } from "@admin/domain/admin.types";
import type { ModuleAccess } from "@admin/domain/module-access";

export interface EmployeeDetail {
  readonly id: string; readonly profile_id: string; readonly tenant_id: string;
  readonly middle_name: string | null; readonly last_name: string | null; readonly ssn: string | null; readonly date_of_birth: string | null;
  readonly gender: string | null; readonly marital_status: string | null; readonly dependents: number | null;
  readonly address_line1: string | null; readonly address_line2: string | null; readonly city: string | null; readonly state_province: string | null; readonly zip_code: string | null; readonly country: string | null;
  readonly personal_phone: string | null; readonly alternate_phone: string | null; readonly personal_email: string | null; readonly photo_url: string | null;
  readonly emergency_name: string | null; readonly emergency_relationship: string | null; readonly emergency_phone: string | null; readonly emergency_phone_alt: string | null; readonly emergency_address: string | null;
  readonly department: string | null; readonly hire_date: string | null; readonly termination_date: string | null; readonly contract_type: string | null; readonly probation_end_date: string | null;
  readonly flsa_classification: string | null; readonly gross_salary: number | null; readonly pay_frequency: string | null; readonly risk_classification: string | null;
  readonly supervisor_id: string | null; readonly employee_number: string | null; readonly professional_notes: string | null;
  readonly vacation_rate: number | null; readonly vacation_used: number | null; readonly vacation_max: number | null;
  readonly sick_rate: number | null; readonly sick_used: number | null; readonly sick_max: number | null;
  readonly bonus_applies: boolean | null; readonly bonus_pct: number | null; readonly bonus_paid: number | null;
  readonly medical_plan: boolean | null; readonly medical_provider: string | null; readonly medical_policy_number: string | null; readonly medical_coverage: string | null;
  readonly medical_employee_contribution: number | null; readonly medical_employer_contribution: number | null;
  readonly retirement_plan: boolean | null; readonly retirement_type: string | null; readonly retirement_employee_pct: number | null; readonly retirement_employer_match_pct: number | null; readonly retirement_provider: string | null;
  readonly life_insurance: boolean | null; readonly parking: boolean | null; readonly company_vehicle: boolean | null; readonly company_phone: boolean | null; readonly other_benefits: string | null;
  readonly medical_exam_status: string | null; readonly medical_exam_date: string | null; readonly medical_exam_next: string | null;
  readonly drug_test_status: string | null; readonly drug_test_date: string | null;
  readonly medical_conditions: string | null; readonly allergies: string | null; readonly blood_type: string | null; readonly current_medications: string | null; readonly physical_limitations: string | null;
  readonly uses_uniform: boolean | null; readonly shirt_size: string | null; readonly pants_size: string | null; readonly shoe_size: string | null;
  readonly protective_equipment: string[] | null; readonly assigned_equipment: string | null;
  readonly module_access: ModuleAccess | null;
}

export type EmployeeDetailUpdate = Partial<Omit<EmployeeDetail, "id" | "tenant_id" | "profile_id">>;

export interface IEmployeeDetailRepository {
  get(profileId: string): Promise<EmployeeDetail | null>;
  upsert(profileId: string, d: EmployeeDetailUpdate): Promise<RepoResult>;
}
