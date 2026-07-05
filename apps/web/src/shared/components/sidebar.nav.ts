import {
  LayoutDashboard, Route as RouteIcon, Package, Calendar, DollarSign, CreditCard, Users,
  AlertCircle, Scale, BarChart3, UserPlus, Megaphone, ShoppingCart, FileText,
  ClipboardCheck, GraduationCap, LifeBuoy, Settings,
  Cog, Wallet, Store, Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";

// Solo las rutas ya construidas llevan `to`; el resto se renderiza deshabilitado.
type EnabledPath = "/dashboard" | "/income";
export type NavItem = { key: TranslationKey; icon: LucideIcon; to?: EnabledPath };
export type NavSection = { title: TranslationKey; icon: LucideIcon; items: NavItem[] };

export const SECTIONS: NavSection[] = [
  { title: "operations", icon: Cog, items: [
    { key: "panel", icon: LayoutDashboard, to: "/dashboard" },
    { key: "routes", icon: RouteIcon }, { key: "inventory", icon: Package },
    { key: "agenda", icon: Calendar },
  ] },
  { title: "finance", icon: Wallet, items: [
    { key: "income", icon: DollarSign, to: "/income" },
    { key: "expenses", icon: CreditCard }, { key: "payroll", icon: Users },
    { key: "extraordinary", icon: AlertCircle }, { key: "reconciliation", icon: Scale },
    { key: "reports", icon: BarChart3 },
  ] },
  { title: "salesCrm", icon: Store, items: [
    { key: "leads", icon: UserPlus }, { key: "marketing", icon: Megaphone },
    { key: "orders", icon: ShoppingCart }, { key: "quotes", icon: FileText },
  ] },
  { title: "management", icon: Briefcase, items: [
    { key: "evaluations", icon: ClipboardCheck }, { key: "training", icon: GraduationCap },
    { key: "support", icon: LifeBuoy }, { key: "settings", icon: Settings },
  ] },
];
