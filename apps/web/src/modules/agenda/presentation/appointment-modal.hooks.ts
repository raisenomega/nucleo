import { useState } from "react";
import type { Appointment, AppointmentInput, AppointmentStatus } from "@agenda/domain/appointment.types";

export interface AptForm { title: string; leadId: string | null; leadName: string; serviceId: string | null; startsAt: string; duration: number; status: AppointmentStatus; notes: string; }
export type SetApt = <K extends keyof AptForm>(k: K, v: AptForm[K]) => void;

const toLocal = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const DEF: AptForm = { title: "", leadId: null, leadName: "", serviceId: null, startsAt: "", duration: 60, status: "agendada", notes: "" };
const fromApt = (a: Appointment): AptForm => ({
  title: a.title, leadId: a.leadId, leadName: a.leadName ?? "", serviceId: a.serviceId, startsAt: toLocal(a.startsAt),
  duration: Math.round((new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60000), status: a.status, notes: a.notes,
});

export function useAppointmentForm(initial?: Appointment, defaultStart?: string) {
  const [form, setForm] = useState<AptForm>(initial ? fromApt(initial) : { ...DEF, startsAt: defaultStart ?? "" });
  const set: SetApt = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const canSave = form.title.trim().length >= 3 && !!form.startsAt && form.duration > 0;
  function toInput(): AppointmentInput {
    const start = new Date(form.startsAt);
    return { title: form.title.trim(), leadId: form.leadId, serviceId: form.serviceId, startsAt: start.toISOString(), endsAt: new Date(start.getTime() + form.duration * 60000).toISOString(), status: form.status, notes: form.notes };
  }
  return { form, set, canSave, toInput };
}
