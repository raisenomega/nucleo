import { Home, User, ClipboardList, ShoppingCart, FileText, CreditCard, Calendar, Send, Star, LifeBuoy, Bell, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";

// Rutas ya construidas llevan `to`; el resto se muestra deshabilitado ("próximamente") — se habilitan en P2-P5.
export type PortalPath = "/portal" | "/portal/profile" | "/portal/orders" | "/portal/invoices" | "/portal/payments" | "/portal/services" | "/portal/appointments" | "/portal/reviews" | "/portal/support" | "/portal/notifications" | "/portal/settings";
export type PortalNavItem = { key: TranslationKey; icon: LucideIcon; to?: PortalPath; href?: string };

export const PORTAL_NAV: PortalNavItem[] = [
  { key: "navHome", icon: Home, to: "/portal" },
  { key: "navProfile", icon: User, to: "/portal/profile" },
  { key: "navServices", icon: ClipboardList, to: "/portal/services" },
  { key: "navOrders", icon: ShoppingCart, to: "/portal/orders" },
  { key: "navInvoices", icon: FileText, to: "/portal/invoices" },
  { key: "navPayments", icon: CreditCard, to: "/portal/payments" },
  { key: "navAppointments", icon: Calendar, to: "/portal/appointments" },
  { key: "navRequest", icon: Send, href: "/catalog" },
  { key: "navReviews", icon: Star, to: "/portal/reviews" },
  { key: "navSupport", icon: LifeBuoy, to: "/portal/support" },
  { key: "navNotifications", icon: Bell, to: "/portal/notifications" },
  { key: "navSettings", icon: Settings, to: "/portal/settings" },
];

// Barra inferior mobile: ítems ya construidos (crece en P3+).
export const BOTTOM_NAV: PortalNavItem[] = [PORTAL_NAV[0]!, PORTAL_NAV[3]!, PORTAL_NAV[1]!];
