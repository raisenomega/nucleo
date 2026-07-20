import { supabase } from "@shared/lib/supabase";
import type { MarketingReservation, ReservationSubmit, ReservationStatus } from "@raisen-marketing/data/reservation.types";

const SEL = "id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, duration_minutes, status, notes, created_at";
const toRes = (o: Record<string, unknown>): MarketingReservation => ({ id: o.id as string, customerName: o.customer_name as string, customerEmail: o.customer_email as string, customerPhone: (o.customer_phone as string) ?? null, reservationDate: o.reservation_date as string, reservationTime: ((o.reservation_time as string) ?? "").slice(0, 5), durationMinutes: o.duration_minutes as number, status: o.status as ReservationStatus, notes: (o.notes as string) ?? null, createdAt: o.created_at as string });

// Slots disponibles de una fecha (RPC pública, ya computa reglas+bloqueos+ocupados).
export async function getSlots(dateStr: string): Promise<string[]> {
  const { data } = await supabase.rpc("_marketing_available_slots", { _date: dateStr });
  return (data as string[]) ?? [];
}
export async function submitReservation(s: ReservationSubmit): Promise<{ ok: boolean; message?: string }> {
  const payload = { customer_name: s.customerName, customer_email: s.customerEmail, customer_phone: s.customerPhone, message: s.message, reservation_date: s.reservationDate, reservation_time: s.reservationTime, lang: s.lang };
  const { data, error } = await supabase.rpc("_marketing_create_reservation", { _payload: payload });
  if (error) return { ok: false, message: error.message };
  const r = data as { status: string; message?: string };
  return r.status === "ok" ? { ok: true } : { ok: false, message: r.message };
}
export async function getReservations(filter: { status?: string; from?: string }): Promise<MarketingReservation[]> {
  let q = supabase.from("marketing_reservations").select(SEL).order("reservation_date", { ascending: false }).order("reservation_time");
  if (filter.status) q = q.eq("status", filter.status);
  if (filter.from) q = q.gte("reservation_date", filter.from);
  const { data } = await q;
  return ((data ?? []) as Record<string, unknown>[]).map(toRes);
}
export async function setReservationFields(id: string, patch: Partial<{ status: ReservationStatus; notes: string }>): Promise<string | null> {
  const { error } = await supabase.from("marketing_reservations").update(patch).eq("id", id);
  return error ? error.message : null;
}
export async function deleteReservation(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_reservations").delete().eq("id", id);
  return error ? error.message : null;
}
