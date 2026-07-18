import { ShoppingCart, UserPlus, Calendar, FileText, Package, Truck, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NotifFilter } from "@shared/notifications/notification.types";

// Mapeos puros entity_type → ícono / ruta / categoría de filtro. Sin estado.
const ICONS: Record<string, LucideIcon> = { order: ShoppingCart, lead: UserPlus, appointment: Calendar, invoice: FileText, inventory_item: Package, asset: Truck };
export const notifIcon = (entityType: string): LucideIcon => ICONS[entityType] ?? Bell;

export function notifRoute(entityType: string, entityId: string | null): string {
  switch (entityType) {
    case "order": return entityId ? `/orders/${entityId}` : "/orders";
    case "lead": return "/leads";
    case "appointment": return "/agenda";
    case "invoice": return "/billing";
    case "inventory_item": return "/inventory";
    case "asset": return "/assets";
    default: return "/dashboard";
  }
}

export function notifCategory(entityType: string): NotifFilter {
  if (entityType === "order" || entityType === "lead" || entityType === "appointment") return entityType;
  return "system";
}

// Tiempo relativo localizado ("hace 5 min" / "5 min ago" / "ayer") vía Intl, sin librería.
export function relativeTime(iso: string, locale: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, secs] of units) if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  return rtf.format(Math.round(diff), "second");
}
