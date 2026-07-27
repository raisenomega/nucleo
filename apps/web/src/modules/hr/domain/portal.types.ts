// BC hr — portal del empleado (self-service). Puro. Todo scoped a auth.uid() vía RPCs definer.
export type PortalResult = { ok: true } | { ok: false; error: string };

export interface MyDetails {
  readonly fullName: string; readonly email: string; readonly phone: string | null;
  readonly position: string | null; readonly avatarUrl: string | null;
  readonly department: string | null; readonly hireDate: string | null;
  readonly addressLine1: string; readonly addressLine2: string; readonly city: string;
  readonly stateProvince: string; readonly zipCode: string;
  readonly personalPhone: string; readonly alternatePhone: string; readonly personalEmail: string;
  readonly emergencyName: string; readonly emergencyRelationship: string;
  readonly emergencyPhone: string; readonly emergencyPhoneAlt: string; readonly emergencyAddress: string;
}
export type MyDetailsEdit = Partial<Omit<MyDetails, "fullName" | "email" | "phone" | "position" | "avatarUrl" | "department" | "hireDate">>;
export interface MyCert { readonly id: string; readonly name: string; readonly number: string | null; readonly issued: string | null; readonly expires: string | null; readonly status: string | null; readonly source: string | null; readonly documentUrl: string | null }
export interface MyCourse { readonly id: string; readonly courseId: string; readonly title: string; readonly status: string; readonly score: number | null; readonly dueDate: string | null; readonly required: boolean; readonly category: string | null }
export interface PendingEval { readonly id: string; readonly employeeName: string; readonly evalType: string; readonly cycle: string | null; readonly period: string }
export interface PayDeduction { readonly label: string; readonly amount: number }
export interface MyPayStub { readonly id: string; readonly date: string; readonly period: string; readonly gross: number; readonly net: number; readonly deductions: readonly PayDeduction[]; readonly hoursRegular: number | null; readonly hoursOvertime: number | null }
export interface PortalSummary {
  readonly lastPayroll: { period: string; date: string; net: number } | null;
  readonly availableLeave: number; readonly coursesTotal: number; readonly coursesCompleted: number;
  readonly pendingEvaluations: number; readonly pendingOnboarding: number; readonly expiringCerts: number;
}

export interface IPortalRepository {
  details(): Promise<MyDetails | null>;
  updateDetails(data: MyDetailsEdit): Promise<PortalResult>;
  certs(): Promise<MyCert[]>;
  training(): Promise<MyCourse[]>;
  pendingEvals(): Promise<PendingEval[]>;
  summary(): Promise<PortalSummary | null>;
  payroll(): Promise<MyPayStub[]>;
}
