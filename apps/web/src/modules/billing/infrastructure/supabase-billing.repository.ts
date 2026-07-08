import { supabase } from "@shared/lib/supabase";
import type { IBillingRepository, BillingPlan, PlanFrequency, PlanStatus } from "@billing/domain/billing-plan.types";
import type { BillingResult } from "@billing/domain/invoice.types";

interface Row {
  id: string; client_name: string; phone: string | null; email: string | null; amount: number;
  frequency: string; service_description: string | null; next_billing_date: string; status: string; created_at: string;
}
const SEL = "id,client_name,phone,email,amount,frequency,service_description,next_billing_date,status,created_at";
const ok = (e: { message: string } | null): BillingResult => (e ? { ok: false, error: e.message } : { ok: true });
const toPlan = (r: Row): BillingPlan => ({
  id: r.id, clientName: r.client_name, phone: r.phone, email: r.email, amount: r.amount,
  frequency: r.frequency as PlanFrequency, serviceDescription: r.service_description,
  nextBillingDate: r.next_billing_date, status: r.status as PlanStatus, createdAt: r.created_at,
});

export const supabaseBillingRepository: IBillingRepository = {
  async listPlans(): Promise<BillingPlan[]> {
    const { data } = await supabase.from("billing_plans").select(SEL).order("next_billing_date", { ascending: true });
    return ((data as Row[] | null) ?? []).map(toPlan);
  },
  async savePlan(d): Promise<BillingResult> {
    return ok((await supabase.from("billing_plans").insert({
      client_name: d.clientName, phone: d.phone || null, email: d.email || null, amount: d.amount,
      frequency: d.frequency, service_description: d.serviceDescription || null, next_billing_date: d.nextBillingDate,
    })).error);
  },
  async setPlanStatus(id, status: PlanStatus): Promise<BillingResult> {
    return ok((await supabase.from("billing_plans").update({ status }).eq("id", id)).error);
  },
  async runCycle(): Promise<number> {
    const { data } = await supabase.rpc("generate_recurring_invoices");
    return (data as number | null) ?? 0;
  },
};
