import { HelpCircle, LayoutDashboard, Building2, Inbox, LayoutList, Target, Zap, ArrowRight, DollarSign, MessageSquare, Lightbulb, FileText, Scale, CalendarCheck, CalendarClock } from "lucide-react";
import type { NavSection } from "@shared/components/sidebar.nav";

// Grupos del sidebar del SUPERADMIN (plataforma) — reemplazan los grupos de tenant. Solo se renderizan cuando
// isSuperAdmin, así que los items no llevan `mod` (siempre visibles). /web/* y /tenants son placeholders (S4-S6).
export const SUPERADMIN_SECTIONS: NavSection[] = [
  { title: "saPlatform", icon: LayoutDashboard, items: [
    { key: "panel", icon: LayoutDashboard, to: "/dashboard" },
    { key: "saTenants", icon: Building2, to: "/tenants" },
  ] },
  { title: "saSiteWeb", icon: FileText, items: [
    { key: "webSections", icon: LayoutList, to: "/web/secciones" },
    { key: "webHero", icon: Target, to: "/web/hero" },
    { key: "webFeatures", icon: Zap, to: "/web/features" },
    { key: "webProcess", icon: ArrowRight, to: "/web/proceso" },
    { key: "webPricing", icon: DollarSign, to: "/web/precios" },
    { key: "webTestimonials", icon: MessageSquare, to: "/web/testimonios" },
    { key: "webSolutions", icon: Lightbulb, to: "/web/soluciones" },
    { key: "webFaq", icon: HelpCircle, to: "/web/faq" },
    { key: "webFooter", icon: FileText, to: "/web/footer" },
    { key: "webLegal", icon: Scale, to: "/web/legales" },
    { key: "saLeadsCommercial", icon: Inbox, to: "/web/leads" },
    { key: "webReservations", icon: CalendarCheck, to: "/web/reservas" },
    { key: "webAvailability", icon: CalendarClock, to: "/web/disponibilidad" },
  ] },
  // Sin grupo "Configuración": el acceso a /settings es el engranaje del footer del sidebar (SidebarUser),
  // que ya existe. Tener ambos duplicaba la misma entrada.
];
