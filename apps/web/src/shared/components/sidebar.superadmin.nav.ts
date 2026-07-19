import { LayoutDashboard, Building2, Inbox, LayoutList, Target, Zap, ArrowRight, DollarSign, MessageSquare, FileText, Settings } from "lucide-react";
import type { NavSection } from "@shared/components/sidebar.nav";

// Grupos del sidebar del SUPERADMIN (plataforma) — reemplazan los grupos de tenant. Solo se renderizan cuando
// isSuperAdmin, así que los items no llevan `mod` (siempre visibles). /web/* y /tenants son placeholders (S4-S6).
export const SUPERADMIN_SECTIONS: NavSection[] = [
  { title: "saPlatform", icon: LayoutDashboard, items: [
    { key: "panel", icon: LayoutDashboard, to: "/dashboard" },
    { key: "saTenants", icon: Building2, to: "/tenants" },
    { key: "saLeadsCommercial", icon: Inbox, to: "/web/leads" },
  ] },
  { title: "saSiteWeb", icon: FileText, items: [
    { key: "webSections", icon: LayoutList, to: "/web/secciones" },
    { key: "webHero", icon: Target, to: "/web/hero" },
    { key: "webFeatures", icon: Zap, to: "/web/features" },
    { key: "webProcess", icon: ArrowRight, to: "/web/proceso" },
    { key: "webPricing", icon: DollarSign, to: "/web/precios" },
    { key: "webTestimonials", icon: MessageSquare, to: "/web/testimonios" },
    { key: "webFooter", icon: FileText, to: "/web/footer" },
  ] },
  { title: "saConfig", icon: Settings, items: [
    { key: "systemSettings", icon: Settings, to: "/settings" },
  ] },
];
