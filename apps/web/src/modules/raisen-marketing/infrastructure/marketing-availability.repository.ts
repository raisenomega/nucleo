import { supabase } from "@shared/lib/supabase";
import type { AvailabilityConfig, BlockedDate } from "@raisen-marketing/data/reservation.types";

const t5 = (v: unknown) => ((v as string) ?? "").slice(0, 5); // time 'HH:MM:SS' → 'HH:MM'
const toCfg = (o: Record<string, unknown>): AvailabilityConfig => ({ id: o.id as string, timezone: o.timezone as string, durationMinutes: o.duration_minutes as number, bufferMinutes: o.buffer_minutes as number, maxPerDay: o.max_per_day as number, availableDays: (o.available_days as number[]) ?? [], hoursStart: t5(o.hours_start), hoursEnd: t5(o.hours_end), titleEs: o.title_es as string, titleEn: o.title_en as string, subtitleEs: o.subtitle_es as string, subtitleEn: o.subtitle_en as string, confirmEs: o.confirm_es as string, confirmEn: o.confirm_en as string });

export async function getAvailabilityConfig(): Promise<AvailabilityConfig | null> {
  const { data } = await supabase.from("marketing_availability").select("*").limit(1).maybeSingle();
  return data ? toCfg(data as Record<string, unknown>) : null;
}
export async function saveAvailabilityConfig(c: AvailabilityConfig): Promise<string | null> {
  const { error } = await supabase.from("marketing_availability").update({
    timezone: c.timezone, duration_minutes: c.durationMinutes, buffer_minutes: c.bufferMinutes, max_per_day: c.maxPerDay,
    available_days: c.availableDays, hours_start: c.hoursStart, hours_end: c.hoursEnd,
    title_es: c.titleEs, title_en: c.titleEn, subtitle_es: c.subtitleEs, subtitle_en: c.subtitleEn, confirm_es: c.confirmEs, confirm_en: c.confirmEn,
  }).eq("id", c.id);
  return error ? error.message : null;
}
export async function getBlockedDates(): Promise<BlockedDate[]> {
  const { data } = await supabase.from("marketing_blocked_dates").select("id, blocked_date, reason").order("blocked_date");
  return ((data ?? []) as Record<string, unknown>[]).map((o) => ({ id: o.id as string, blockedDate: o.blocked_date as string, reason: (o.reason as string) ?? "" }));
}
export async function addBlockedDate(date: string, reason: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_blocked_dates").insert({ blocked_date: date, reason });
  return error ? error.message : null;
}
export async function deleteBlockedDate(id: string): Promise<string | null> {
  const { error } = await supabase.from("marketing_blocked_dates").delete().eq("id", id);
  return error ? error.message : null;
}
