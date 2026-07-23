import { ShoppingCart, UserPlus, Calendar, FileText, Package, Truck, Bell,
  LifeBuoy, ClipboardCheck, Eye, Award, GraduationCap, Users, FileCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NotifFilter } from "@shared/notifications/notification.types";

// Mapeos puros entity_type → ícono / ruta / categoría de filtro. Sin estado. 2.6c: + tipos de GESTIÓN.
const ICONS: Record<string, LucideIcon> = {
  order: ShoppingCart, lead: UserPlus, appointment: Calendar, invoice: FileText, inventory_item: Package, asset: Truck,
  ticket: LifeBuoy, evaluation: ClipboardCheck, observation: Eye, certification: Award, training: GraduationCap, employee: Users, document: FileCheck,
};
export const notifIcon = (entityType: string): LucideIcon => ICONS[entityType] ?? Bell;

const ROUTES: Record<string, string> = {
  lead: "/leads", appointment: "/agenda", invoice: "/billing", inventory_item: "/inventory", asset: "/assets",
  ticket: "/support", evaluation: "/evaluations", observation: "/observations", certification: "/settings-team", training: "/training", employee: "/settings-team", document: "/documents",
};
export function notifRoute(entityType: string, entityId: string | null): string {
  if (entityType === "order") return entityId ? `/orders/${entityId}` : "/orders";
  return ROUTES[entityType] ?? "/dashboard";
}

const MGMT = new Set(["evaluation", "observation", "certification", "training", "ticket", "employee"]);
export function notifCategory(entityType: string): NotifFilter {
  if (entityType === "order" || entityType === "lead" || entityType === "appointment") return entityType;
  return MGMT.has(entityType) ? "management" : "system";
}

// Tiempo relativo localizado ("hace 5 min" / "5 min ago" / "ayer") vía Intl, sin librería.
export function relativeTime(iso: string, locale: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, secs] of units) if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  return rtf.format(Math.round(diff), "second");
}
