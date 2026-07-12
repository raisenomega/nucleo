import {
  Route as RouteIcon, Package, Calendar, Truck, DollarSign, CreditCard, Users,
  AlertCircle, Scale, Repeat, HandCoins, RefreshCw, BarChart3, UserPlus, Megaphone, ShoppingCart, FileText,
  Home, FileCheck, ClipboardCheck, NotebookPen, GraduationCap, LifeBuoy, Bell, Settings,
  Cog, Wallet, Store, Briefcase, Palette, SlidersHorizontal, Tags, Wrench, Boxes, Quote, HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";

// Solo las rutas ya construidas llevan `to`; el resto se renderiza deshabilitado.
// Solo rutas con archivo real (TanStack <Link to> valida contra rutas generadas). Las rutas landing
// futuras (products/services/packages/faqs/…) se agregan acá cuando exista su archivo (Sesión 3.b+).
type EnabledPath = "/dashboard" | "/routes" | "/income" | "/expenses" | "/extraordinary" | "/payroll" | "/inventory" | "/leads" | "/marketing" | "/reconciliation" | "/recurring" | "/accounts-receivable" | "/billing" | "/quotes" | "/reports" | "/evaluations" | "/observations" | "/training" | "/support" | "/documents" | "/settings" | "/settings/agenda"
  | "/settings/landing/config" | "/settings/landing/categories" | "/settings/landing/products" | "/settings/landing/services" | "/settings/landing/packages" | "/settings/landing/testimonials" | "/settings/landing/faqs";
// mod = clave de módulo para el gate (can(mod,"view")). Items sin mod = "próximamente" (solo roadmap coo/ceo).
export type NavItem = { key: TranslationKey; icon: LucideIcon; to?: EnabledPath; mod?: string };
export type NavSection = { title: TranslationKey; icon: LucideIcon; items: NavItem[] };

export const SECTIONS: NavSection[] = [
  { title: "operations", icon: Cog, items: [
    { key: "routes", icon: RouteIcon, to: "/routes", mod: "routes" }, { key: "inventory", icon: Package, to: "/inventory", mod: "inventory" },
    { key: "agenda", icon: Calendar, to: "/settings/agenda", mod: "settings" }, { key: "assets", icon: Truck },
  ] },
  { title: "finance", icon: Wallet, items: [
    { key: "income", icon: DollarSign, to: "/income", mod: "income" },
    { key: "expenses", icon: CreditCard, to: "/expenses", mod: "expenses" }, { key: "payroll", icon: Users, to: "/payroll", mod: "payroll" },
    { key: "extraordinary", icon: AlertCircle, to: "/extraordinary", mod: "extraordinary" }, { key: "reconciliation", icon: Scale, to: "/reconciliation", mod: "reconciliation" },
    { key: "recurringExpenses", icon: Repeat, to: "/recurring", mod: "recurring" },
    { key: "accountsReceivable", icon: HandCoins, to: "/accounts-receivable", mod: "accounts_receivable" }, { key: "billing", icon: RefreshCw, to: "/billing", mod: "billing" }, { key: "reports", icon: BarChart3, to: "/reports", mod: "reports" },
  ] },
  { title: "salesCrm", icon: Store, items: [
    { key: "leads", icon: UserPlus, to: "/leads", mod: "leads" }, { key: "marketing", icon: Megaphone, to: "/marketing", mod: "marketing" },
    { key: "orders", icon: ShoppingCart }, { key: "quotes", icon: FileText, to: "/quotes", mod: "quotes" },
    { key: "portal", icon: Home }, { key: "documents", icon: FileCheck, to: "/documents", mod: "documents" },
  ] },
  { title: "management", icon: Briefcase, items: [
    { key: "evaluations", icon: ClipboardCheck, to: "/evaluations", mod: "evaluations" },
    { key: "observations", icon: NotebookPen, to: "/observations", mod: "observations" },
    { key: "training", icon: GraduationCap, to: "/training", mod: "training" },
    { key: "support", icon: LifeBuoy, to: "/support", mod: "support" }, { key: "notifications", icon: Bell },
  ] },
];

// Sección Landing — inyectada por Sidebar solo si landingEnabled && CEO. mod:"settings" pasa el filtro CEO.
export const LANDING_SECTION: NavSection = {
  title: "landing", icon: Palette, items: [
    { key: "landingSiteSettings", icon: SlidersHorizontal, to: "/settings/landing/config", mod: "settings" },
    { key: "landingCategories", icon: Tags, to: "/settings/landing/categories", mod: "settings" },
    { key: "products", icon: Package, to: "/settings/landing/products", mod: "settings" },
    { key: "services", icon: Wrench, to: "/settings/landing/services", mod: "settings" },
    { key: "packages", icon: Boxes, to: "/settings/landing/packages", mod: "settings" },
    { key: "testimonials", icon: Quote, to: "/settings/landing/testimonials", mod: "settings" },
    { key: "faqs", icon: HelpCircle, to: "/settings/landing/faqs", mod: "settings" },
  ],
};
