import {
  Route as RouteIcon, Package, Calendar, Truck, DollarSign, CreditCard, Users,
  AlertCircle, Scale, Repeat, HandCoins, RefreshCw, BarChart3, UserPlus, Megaphone, ShoppingCart, FileText,
  Home, FileCheck, ClipboardCheck, GraduationCap, LifeBuoy, Bell, Settings,
  Cog, Wallet, Store, Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";

// Solo las rutas ya construidas llevan `to`; el resto se renderiza deshabilitado.
type EnabledPath = "/dashboard" | "/routes" | "/income" | "/expenses" | "/extraordinary" | "/payroll" | "/inventory" | "/leads" | "/marketing" | "/reconciliation" | "/recurring" | "/accounts-receivable" | "/reports" | "/settings";
// mod = clave de módulo para el gate (can(mod,"view")). Items sin mod = "próximamente" (solo roadmap coo/ceo).
export type NavItem = { key: TranslationKey; icon: LucideIcon; to?: EnabledPath; mod?: string };
export type NavSection = { title: TranslationKey; icon: LucideIcon; items: NavItem[] };

export const SECTIONS: NavSection[] = [
  { title: "operations", icon: Cog, items: [
    { key: "routes", icon: RouteIcon, to: "/routes", mod: "routes" }, { key: "inventory", icon: Package, to: "/inventory", mod: "inventory" },
    { key: "agenda", icon: Calendar }, { key: "assets", icon: Truck },
  ] },
  { title: "finance", icon: Wallet, items: [
    { key: "income", icon: DollarSign, to: "/income", mod: "income" },
    { key: "expenses", icon: CreditCard, to: "/expenses", mod: "expenses" }, { key: "payroll", icon: Users, to: "/payroll", mod: "payroll" },
    { key: "extraordinary", icon: AlertCircle, to: "/extraordinary", mod: "extraordinary" }, { key: "reconciliation", icon: Scale, to: "/reconciliation", mod: "reconciliation" },
    { key: "recurringExpenses", icon: Repeat, to: "/recurring", mod: "recurring" },
    { key: "accountsReceivable", icon: HandCoins, to: "/accounts-receivable", mod: "accounts_receivable" }, { key: "billing", icon: RefreshCw }, { key: "reports", icon: BarChart3, to: "/reports", mod: "reports" },
  ] },
  { title: "salesCrm", icon: Store, items: [
    { key: "leads", icon: UserPlus, to: "/leads", mod: "leads" }, { key: "marketing", icon: Megaphone, to: "/marketing", mod: "marketing" },
    { key: "orders", icon: ShoppingCart }, { key: "quotes", icon: FileText },
    { key: "portal", icon: Home }, { key: "documents", icon: FileCheck },
  ] },
  { title: "management", icon: Briefcase, items: [
    { key: "evaluations", icon: ClipboardCheck }, { key: "training", icon: GraduationCap },
    { key: "support", icon: LifeBuoy }, { key: "notifications", icon: Bell },
    { key: "settings", icon: Settings, to: "/settings", mod: "settings" },
  ] },
];
