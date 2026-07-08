// BC billing — planes recurrentes (MRR). Puro.
import type { BillingResult } from "@billing/domain/invoice.types";

export type PlanFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "annual";
export type PlanStatus = "active" | "paused" | "cancelled";

export interface BillingPlan {
  readonly id: string; readonly clientName: string; readonly phone: string | null; readonly email: string | null;
  readonly amount: number; readonly frequency: PlanFrequency; readonly serviceDescription: string | null;
  readonly nextBillingDate: string; readonly status: PlanStatus; readonly createdAt: string;
}
export interface BillingPlanInput {
  clientName: string; phone: string; email: string; amount: number;
  frequency: PlanFrequency; serviceDescription: string; nextBillingDate: string;
}
export interface IBillingRepository {
  listPlans(): Promise<BillingPlan[]>;
  savePlan(input: BillingPlanInput): Promise<BillingResult>;
  setPlanStatus(id: string, status: PlanStatus): Promise<BillingResult>;
  runCycle(): Promise<number>;
}
