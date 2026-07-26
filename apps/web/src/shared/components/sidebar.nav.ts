import {
  Route as RouteIcon, Package, Calendar, Truck, DollarSign, CreditCard, Users,
  AlertCircle, Scale, Repeat, HandCoins, RefreshCw, BarChart3, UserPlus, Megaphone, ShoppingCart, FileText,
  ShoppingBag, FileCheck, ClipboardCheck, NotebookPen, GraduationCap, LifeBuoy, Bell, Settings,
  Cog, Wallet, Store, Briefcase, Palette, SlidersHorizontal, Tags, Wrench, Boxes, Quote, HelpCircle, FileInput, Layers, Ticket,
  BookOpen, BookMarked, ScrollText, TrendingUp, Lock, Receipt, Banknote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";

// Solo las rutas ya construidas llevan `to`; el resto se renderiza deshabilitado.
// Solo rutas con archivo real (TanStack <Link to> valida contra rutas generadas). Las rutas landing
// futuras (products/services/packages/faqs/…) se agregan acá cuando exista su archivo (Sesión 3.b+).
type EnabledPath = "/dashboard" | "/routes" | "/income" | "/expenses" | "/extraordinary" | "/payroll" | "/inventory" | "/inventory/suppliers" | "/inventory/purchase-orders" | "/inventory/counts" | "/leads" | "/marketing" | "/reconciliation" | "/recurring" | "/accounts-receivable" | "/billing" | "/quotes" | "/reports" | "/accounting/chart" | "/accounting/journal" | "/accounting/income-statement" | "/accounting/balance-sheet" | "/accounting/period-close" | "/accounting/payables" | "/accounting/cash-flow" | "/evaluations" | "/observations" | "/training" | "/support" | "/documents" | "/settings" | "/settings/agenda" | "/agenda" | "/orders" | "/assets" | "/notifications" | "/customers"
  | "/tenants" | "/platform/analytics" | "/web/campanas" | "/web/leads" | "/web/secciones" | "/web/hero" | "/web/features" | "/web/proceso" | "/web/precios" | "/web/testimonios" | "/web/soluciones" | "/web/faq" | "/web/footer" | "/web/legales" | "/web/reservas" | "/web/disponibilidad"
  | "/settings/landing/config" | "/settings/landing/categories" | "/settings/landing/products" | "/settings/landing/services" | "/settings/landing/packages" | "/settings/landing/testimonials" | "/settings/landing/faqs" | "/settings/landing/order-forms" | "/settings/landing/service-pages" | "/settings/landing/coupons" | "/settings/landing/payment-methods" | "/settings/landing/analytics" | "/campanas";
// mod = clave de módulo para el gate (can(mod,"view")). Items sin mod = "próximamente" (solo roadmap coo/ceo).
export type NavItem = { key: TranslationKey; icon: LucideIcon; to?: EnabledPath; mod?: string };
export type NavSection = { title: TranslationKey; icon: LucideIcon; items: NavItem[] };

// Items fijos arriba (fuera de grupos colapsables), gated por su módulo. Órdenes Web lleva badge de órdenes sin ver.
export const PINNED_ITEMS: NavItem[] = [
  { key: "navClientes", icon: Users, to: "/customers", mod: "customers" },
  { key: "navOrdersWeb", icon: ShoppingBag, to: "/orders", mod: "orders" },
];

export const SECTIONS: NavSection[] = [
  { title: "salesCrm", icon: Store, items: [
    { key: "leads", icon: UserPlus, to: "/leads", mod: "leads" }, { key: "marketing", icon: Megaphone, to: "/marketing", mod: "marketing" },
    { key: "quotes", icon: FileText, to: "/quotes", mod: "quotes" }, { key: "billing", icon: RefreshCw, to: "/billing", mod: "billing" },
  ] },
  { title: "operations", icon: Cog, items: [
    { key: "routes", icon: RouteIcon, to: "/routes", mod: "routes" },
    { key: "agenda", icon: Calendar, to: "/agenda", mod: "settings" }, { key: "assets", icon: Truck, to: "/assets", mod: "assets" },
  ] },
  { title: "inventory", icon: Package, items: [
    { key: "inventoryItems", icon: Boxes, to: "/inventory", mod: "inventory" },
    { key: "suppliers", icon: Store, to: "/inventory/suppliers", mod: "inventory" },
    { key: "purchaseOrders", icon: ShoppingCart, to: "/inventory/purchase-orders", mod: "inventory" }, { key: "cyclicCount", icon: ClipboardCheck, to: "/inventory/counts", mod: "inventory" },
  ] },
  { title: "finance", icon: Wallet, items: [
    { key: "income", icon: DollarSign, to: "/income", mod: "income" },
    { key: "expenses", icon: CreditCard, to: "/expenses", mod: "expenses" }, { key: "recurringExpenses", icon: Repeat, to: "/recurring", mod: "recurring" },
    { key: "payroll", icon: Users, to: "/payroll", mod: "payroll" }, { key: "extraordinary", icon: AlertCircle, to: "/extraordinary", mod: "extraordinary" },
    { key: "reconciliation", icon: Scale, to: "/reconciliation", mod: "reconciliation" },
  ] },
];

// Sección Contabilidad (GL) — inyectada por Sidebar solo si gl_enabled. Items gated por can(mod,"view").
export const ACCOUNTING_SECTION: NavSection = { title: "accounting", icon: BookOpen, items: [
  { key: "chartOfAccounts", icon: BookMarked, to: "/accounting/chart", mod: "accounting" }, { key: "generalLedger", icon: ScrollText, to: "/accounting/journal", mod: "accounting" }, { key: "accountsReceivable", icon: HandCoins, to: "/accounts-receivable", mod: "accounts_receivable" }, { key: "accountsPayable", icon: Receipt, to: "/accounting/payables", mod: "accounting" }, { key: "incomeStatement", icon: TrendingUp, to: "/accounting/income-statement", mod: "accounting" }, { key: "balanceSheet", icon: Scale, to: "/accounting/balance-sheet", mod: "accounting" }, { key: "cashFlow", icon: Banknote, to: "/accounting/cash-flow", mod: "accounting" }, { key: "periodClose", icon: Lock, to: "/accounting/period-close", mod: "accounting" }] };

// Sección Landing — inyectada por Sidebar solo si landingEnabled && CEO. mod:"settings" pasa el filtro CEO.
export const LANDING_SECTION: NavSection = { title: "landing", icon: Palette, items: [
  { key: "landingSiteSettings", icon: SlidersHorizontal, to: "/settings/landing/config", mod: "settings" }, { key: "landingServicePages", icon: Layers, to: "/settings/landing/service-pages", mod: "settings" }, { key: "landingCategories", icon: Tags, to: "/settings/landing/categories", mod: "settings" },
  { key: "products", icon: Package, to: "/settings/landing/products", mod: "settings" }, { key: "services", icon: Wrench, to: "/settings/landing/services", mod: "settings" }, { key: "packages", icon: Boxes, to: "/settings/landing/packages", mod: "settings" },
  { key: "testimonials", icon: Quote, to: "/settings/landing/testimonials", mod: "settings" }, { key: "faqs", icon: HelpCircle, to: "/settings/landing/faqs", mod: "settings" }, { key: "landingOrderForms", icon: FileInput, to: "/settings/landing/order-forms", mod: "settings" },
  { key: "landingCoupons", icon: Ticket, to: "/settings/landing/coupons", mod: "settings" }, { key: "landingPaymentMethods", icon: CreditCard, to: "/settings/landing/payment-methods", mod: "settings" }] };

// Campañas y Analytics: grupos propios (el sitio web ≠ las campañas ≠ la medición). Mismo gate que LANDING.
export const CAMPAIGNS_SECTION: NavSection = {
  title: "landingCampaigns", icon: Megaphone,
  items: [{ key: "landingCampaigns", icon: Megaphone, to: "/campanas", mod: "settings" }],
};
export const ANALYTICS_SECTION: NavSection = {
  title: "landingAnalytics", icon: BarChart3,
  items: [{ key: "landingAnalytics", icon: BarChart3, to: "/settings/landing/analytics", mod: "settings" }],
};

// Reportes: grupo propio al final. Gestión: se conserva al final (evaluaciones/RRHH/soporte/notificaciones).
export const REPORTS_SECTION: NavSection = { title: "reports", icon: FileText, items: [{ key: "reports", icon: BarChart3, to: "/reports", mod: "reports" }] };
export const MANAGEMENT_SECTION: NavSection = { title: "management", icon: Briefcase, items: [
  { key: "evaluations", icon: ClipboardCheck, to: "/evaluations", mod: "evaluations" }, { key: "observations", icon: NotebookPen, to: "/observations", mod: "observations" },
  { key: "training", icon: GraduationCap, to: "/training", mod: "training" }, { key: "support", icon: LifeBuoy, to: "/support", mod: "support" },
  { key: "documents", icon: FileCheck, to: "/documents", mod: "documents" }, { key: "notifications", icon: Bell, to: "/notifications" }] };
