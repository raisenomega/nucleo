import { supabase } from "@shared/lib/supabase";
import type {
  IPortalRepository, MyDetails, MyDetailsEdit, MyCert, MyCourse, PendingEval, PortalSummary, MyPayStub, PortalResult,
} from "@hr/domain/portal.types";

const ok = (e: { message: string } | null): PortalResult => (e ? { ok: false, error: e.message } : { ok: true });
type J = Record<string, unknown>;
const s = (v: unknown) => (v as string) ?? "";
const detailsFrom = (d: J): MyDetails => ({
  fullName: s(d.full_name), email: s(d.email), phone: (d.phone as string) ?? null, position: (d.position as string) ?? null,
  avatarUrl: (d.avatar_url as string) ?? null, department: (d.department as string) ?? null, hireDate: (d.hire_date as string) ?? null,
  addressLine1: s(d.address_line1), addressLine2: s(d.address_line2), city: s(d.city), stateProvince: s(d.state_province), zipCode: s(d.zip_code),
  personalPhone: s(d.personal_phone), alternatePhone: s(d.alternate_phone), personalEmail: s(d.personal_email),
  emergencyName: s(d.emergency_name), emergencyRelationship: s(d.emergency_relationship),
  emergencyPhone: s(d.emergency_phone), emergencyPhoneAlt: s(d.emergency_phone_alt), emergencyAddress: s(d.emergency_address),
});
const editRow = (e: MyDetailsEdit) => ({
  address_line1: e.addressLine1, address_line2: e.addressLine2, city: e.city, state_province: e.stateProvince, zip_code: e.zipCode,
  personal_phone: e.personalPhone, alternate_phone: e.alternatePhone, personal_email: e.personalEmail,
  emergency_name: e.emergencyName, emergency_relationship: e.emergencyRelationship,
  emergency_phone: e.emergencyPhone, emergency_phone_alt: e.emergencyPhoneAlt, emergency_address: e.emergencyAddress,
});

export const supabasePortalRepository: IPortalRepository = {
  async details(): Promise<MyDetails | null> {
    const { data } = await supabase.rpc("get_my_employee_details");
    return data ? detailsFrom(data as J) : null;
  },
  async updateDetails(e): Promise<PortalResult> { return ok((await supabase.rpc("update_my_employee_details", { p_data: editRow(e) })).error); },
  async certs(): Promise<MyCert[]> {
    const { data } = await supabase.rpc("get_my_certifications");
    return ((data as J[] | null) ?? []).map((c) => ({ id: c.id as string, name: s(c.name), number: (c.number as string) ?? null,
      issued: (c.issued as string) ?? null, expires: (c.expires as string) ?? null, status: (c.status as string) ?? null,
      source: (c.source as string) ?? null, documentUrl: (c.document_url as string) ?? null }));
  },
  async training(): Promise<MyCourse[]> {
    const { data } = await supabase.rpc("get_my_training");
    return ((data as J[] | null) ?? []).map((c) => ({ id: c.id as string, courseId: c.course_id as string, title: s(c.title),
      status: s(c.status), score: c.score != null ? Number(c.score) : null, dueDate: (c.due_date as string) ?? null,
      required: !!c.required, category: (c.category as string) ?? null }));
  },
  async pendingEvals(): Promise<PendingEval[]> {
    const { data } = await supabase.rpc("get_my_pending_evaluations");
    return ((data as J[] | null) ?? []).map((e) => ({ id: e.id as string, employeeName: s(e.employee_name),
      evalType: s(e.eval_type), cycle: (e.cycle as string) ?? null, period: s(e.period) }));
  },
  async summary(): Promise<PortalSummary | null> {
    const { data } = await supabase.rpc("get_my_portal_summary"); const d = data as J | null;
    if (!d) return null;
    const lp = d.last_payroll as J | null;
    return { lastPayroll: lp ? { period: s(lp.period), date: s(lp.date), net: Number(lp.net ?? 0) } : null,
      availableLeave: Number(d.available_leave ?? 0), coursesTotal: Number(d.courses_total ?? 0), coursesCompleted: Number(d.courses_completed ?? 0),
      pendingEvaluations: Number(d.pending_evaluations ?? 0), pendingOnboarding: Number(d.pending_onboarding ?? 0), expiringCerts: Number(d.expiring_certs ?? 0) };
  },
  async payroll(): Promise<MyPayStub[]> {
    const { data } = await supabase.from("payroll").select("id,pay_date,period,gross_salary,net_salary,deductions_employee,hours_regular,hours_overtime").is("deleted_at", null).order("pay_date", { ascending: false });
    return ((data as J[] | null) ?? []).map((p) => ({ id: p.id as string, date: s(p.pay_date), period: s(p.period),
      gross: Number(p.gross_salary ?? 0), net: Number(p.net_salary ?? 0), hoursRegular: p.hours_regular != null ? Number(p.hours_regular) : null,
      hoursOvertime: p.hours_overtime != null ? Number(p.hours_overtime) : null,
      deductions: (Array.isArray(p.deductions_employee) ? p.deductions_employee : []).map((x: J) => ({ label: s(x.label), amount: Number(x.amount ?? 0) })) }));
  },
};
