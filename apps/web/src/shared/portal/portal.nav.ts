import { Home, User, ClipboardList, ShoppingCart, FileText, CreditCard, Calendar, Send, Star, LifeBuoy, Bell, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";

// Rutas ya construidas llevan `to`; el resto se muestra deshabilitado ("próximamente") — se habilitan en P2-P5.
export type PortalPath = "/portal" | "/portal/profile";
export type PortalNavItem = { key: TranslationKey; icon: LucideIcon; to?: PortalPath };

export const PORTAL_NAV: PortalNavItem[] = [
  { key: "navHome", icon: Home, to: "/portal" },
  { key: "navProfile", icon: User, to: "/portal/profile" },
  { key: "navServices", icon: ClipboardList },
  { key: "navOrders", icon: ShoppingCart },
  { key: "navInvoices", icon: FileText },
  { key: "navPayments", icon: CreditCard },
  { key: "navAppointments", icon: Calendar },
  { key: "navRequest", icon: Send },
  { key: "navReviews", icon: Star },
  { key: "navSupport", icon: LifeBuoy },
  { key: "navNotifications", icon: Bell },
  { key: "navSettings", icon: Settings },
];

// Barra inferior mobile: solo los ítems ya construidos (crece en P2-P3).
export const BOTTOM_NAV: PortalNavItem[] = [PORTAL_NAV[0]!, PORTAL_NAV[1]!];
