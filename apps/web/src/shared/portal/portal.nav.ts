import { Home, User, ClipboardList, ShoppingCart, FileText, CreditCard, Calendar, Send, Star, LifeBuoy, Bell, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";

// Rutas ya construidas llevan `to`; el resto se muestra deshabilitado ("próximamente") — se habilitan en P2-P5.
export type PortalPath = "/portal" | "/portal/profile" | "/portal/orders" | "/portal/invoices" | "/portal/payments";
export type PortalNavItem = { key: TranslationKey; icon: LucideIcon; to?: PortalPath };

export const PORTAL_NAV: PortalNavItem[] = [
  { key: "navHome", icon: Home, to: "/portal" },
  { key: "navProfile", icon: User, to: "/portal/profile" },
  { key: "navServices", icon: ClipboardList },
  { key: "navOrders", icon: ShoppingCart, to: "/portal/orders" },
  { key: "navInvoices", icon: FileText, to: "/portal/invoices" },
  { key: "navPayments", icon: CreditCard, to: "/portal/payments" },
  { key: "navAppointments", icon: Calendar },
  { key: "navRequest", icon: Send },
  { key: "navReviews", icon: Star },
  { key: "navSupport", icon: LifeBuoy },
  { key: "navNotifications", icon: Bell },
  { key: "navSettings", icon: Settings },
];

// Barra inferior mobile: ítems ya construidos (crece en P3+).
export const BOTTOM_NAV: PortalNavItem[] = [PORTAL_NAV[0]!, PORTAL_NAV[3]!, PORTAL_NAV[1]!];
