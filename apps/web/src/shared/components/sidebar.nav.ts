import {
  LayoutDashboard, Route as RouteIcon, Package, Calendar, Truck, DollarSign, CreditCard, Users,
  AlertCircle, Scale, RefreshCw, BarChart3, UserPlus, Megaphone, ShoppingCart, FileText,
  Home, FileCheck, ClipboardCheck, GraduationCap, LifeBuoy, Bell, Settings,
  Cog, Wallet, Store, Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";

// Solo las rutas ya construidas llevan `to`; el resto se renderiza deshabilitado.
type EnabledPath = "/dashboard" | "/income" | "/expenses" | "/extraordinary";
export type NavItem = { key: TranslationKey; icon: LucideIcon; to?: EnabledPath };
export type NavSection = { title: TranslationKey; icon: LucideIcon; items: NavItem[] };

export const SECTIONS: NavSection[] = [
  { title: "operations", icon: Cog, items: [
    { key: "panel", icon: LayoutDashboard, to: "/dashboard" },
    { key: "routes", icon: RouteIcon }, { key: "inventory", icon: Package },
    { key: "agenda", icon: Calendar }, { key: "assets", icon: Truck },
  ] },
  { title: "finance", icon: Wallet, items: [
    { key: "income", icon: DollarSign, to: "/income" },
    { key: "expenses", icon: CreditCard, to: "/expenses" }, { key: "payroll", icon: Users },
    { key: "extraordinary", icon: AlertCircle, to: "/extraordinary" }, { key: "reconciliation", icon: Scale },
    { key: "billing", icon: RefreshCw }, { key: "reports", icon: BarChart3 },
  ] },
  { title: "salesCrm", icon: Store, items: [
    { key: "leads", icon: UserPlus }, { key: "marketing", icon: Megaphone },
    { key: "orders", icon: ShoppingCart }, { key: "quotes", icon: FileText },
    { key: "portal", icon: Home }, { key: "documents", icon: FileCheck },
  ] },
  { title: "management", icon: Briefcase, items: [
    { key: "evaluations", icon: ClipboardCheck }, { key: "training", icon: GraduationCap },
    { key: "support", icon: LifeBuoy }, { key: "notifications", icon: Bell },
    { key: "settings", icon: Settings },
  ] },
];
