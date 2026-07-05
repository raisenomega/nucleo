import {
  LayoutDashboard, Route as RouteIcon, Package, Calendar, DollarSign, CreditCard, Users,
  AlertCircle, Scale, BarChart3, UserPlus, Megaphone, ShoppingCart, FileText,
  ClipboardCheck, GraduationCap, LifeBuoy, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";

// Solo las rutas ya construidas llevan `to`; el resto se renderiza deshabilitado.
type EnabledPath = "/dashboard" | "/income";
export type NavItem = { key: TranslationKey; icon: LucideIcon; to?: EnabledPath };
export type NavSection = { title: TranslationKey; items: NavItem[] };

export const SECTIONS: NavSection[] = [
  { title: "operations", items: [
    { key: "panel", icon: LayoutDashboard, to: "/dashboard" },
    { key: "routes", icon: RouteIcon },
    { key: "inventory", icon: Package },
    { key: "agenda", icon: Calendar },
  ] },
  { title: "finance", items: [
    { key: "income", icon: DollarSign, to: "/income" },
    { key: "expenses", icon: CreditCard },
    { key: "payroll", icon: Users },
    { key: "extraordinary", icon: AlertCircle },
    { key: "reconciliation", icon: Scale },
    { key: "reports", icon: BarChart3 },
  ] },
  { title: "salesCrm", items: [
    { key: "leads", icon: UserPlus },
    { key: "marketing", icon: Megaphone },
    { key: "orders", icon: ShoppingCart },
    { key: "quotes", icon: FileText },
  ] },
  { title: "management", items: [
    { key: "evaluations", icon: ClipboardCheck },
    { key: "training", icon: GraduationCap },
    { key: "support", icon: LifeBuoy },
    { key: "settings", icon: Settings },
  ] },
];
