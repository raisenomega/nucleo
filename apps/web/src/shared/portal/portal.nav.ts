import { Home, User, ClipboardList, ShoppingCart, FileText, CreditCard, Calendar, Send, Star, LifeBuoy, ShoppingBag, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";

// Rutas del portal ya construidas llevan `to`; los links externos (catálogo) llevan `href`.
export type PortalPath = "/portal" | "/portal/profile" | "/portal/orders" | "/portal/invoices" | "/portal/payments" | "/portal/services" | "/portal/appointments" | "/portal/reviews" | "/portal/support" | "/portal/notifications" | "/portal/settings";
export type PortalNavItem = { key: TranslationKey; icon: LucideIcon; to?: PortalPath; href?: string };
export type PortalSection = { key: string; labelKey: TranslationKey; icon: LucideIcon; items: PortalNavItem[] };

// Ítems fijos (fuera de secciones) + hoja Órdenes reutilizada en el bottom nav.
export const PORTAL_HOME: PortalNavItem = { key: "navHome", icon: Home, to: "/portal" };
export const PORTAL_PROFILE: PortalNavItem = { key: "navProfile", icon: User, to: "/portal/profile" };
export const PORTAL_SUPPORT: PortalNavItem = { key: "navSupport", icon: LifeBuoy, to: "/portal/support" };
const ORDERS: PortalNavItem = { key: "navOrders", icon: ShoppingCart, to: "/portal/orders" };

// Secciones acordeón (patrón del sidebar admin).
export const PORTAL_SECTIONS: PortalSection[] = [
  { key: "tienda", labelKey: "sectionTienda", icon: ShoppingBag, items: [
    ORDERS,
    { key: "navInvoices", icon: FileText, to: "/portal/invoices" },
    { key: "navPayments", icon: CreditCard, to: "/portal/payments" },
    { key: "navRequest", icon: Send, href: "/catalog" },
  ] },
  { key: "servicios", labelKey: "sectionServicios", icon: Wrench, items: [
    { key: "navServices", icon: ClipboardList, to: "/portal/services" },
    { key: "navAppointments", icon: Calendar, to: "/portal/appointments" },
    { key: "navReviews", icon: Star, to: "/portal/reviews" },
  ] },
];

// Barra inferior mobile (3 ítems): Inicio, Órdenes, Perfil.
export const BOTTOM_NAV: PortalNavItem[] = [PORTAL_HOME, ORDERS, PORTAL_PROFILE];
