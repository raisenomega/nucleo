// Regla de deducción de nómina (espeja payroll_deduction_rules). snake_case → select/upsert directos, sin mapper.
export interface DeductionRule {
  id: string;
  label: string;
  applies_to: "employee" | "employer" | "contractor";
  calc_type: "percentage" | "fixed_amount";
  rate: number;
  base_source: "gross_salary" | "gross_payroll" | "contract_payment" | "fixed";
  wage_cap: number | null;
  per_employee: boolean;
  frequency: "per_pay_period" | "monthly" | "quarterly" | "annual";
  country_code: string;
  notes: string | null;
  sort: number;
  active: boolean;
}
export type DeductionRuleDraft = Omit<DeductionRule, "id"> & { id?: string };
