import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Check } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useBrand } from "@shared/providers/BrandProvider";
import { useSession } from "@shared/providers/SessionProvider";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { SECTIONS, LANDING_SECTION, type NavSection } from "@shared/components/sidebar.nav";
import { SUPERADMIN_SECTIONS } from "@shared/components/sidebar.superadmin.nav";
import { SidebarSection } from "@shared/components/SidebarSection";
import { SidebarUser } from "@shared/components/SidebarUser";
import { useUnseenWebLeads } from "@shared/hooks/useUnseenWebLeads.hook";
import { useUpcomingAppointments } from "@shared/hooks/useUpcomingAppointments.hook";
import { useOrdersUnseenCount } from "@shared/hooks/useOrdersUnseenCount.hook";
import { useLowStockCount } from "@shared/hooks/useLowStockCount.hook";
import { useAssetsDueCount } from "@shared/hooks/useAssetsDueCount.hook";
import { useNotifCount } from "@shared/hooks/useNotifCount.hook";

function activeSection(pathname: string, groups: NavSection[]): string {
  const s = groups.find((sec) => sec.items.some((i) => i.to && pathname.startsWith(i.to)));
  return s ? s.title : "";
}

export function Sidebar({ expanded, onClose, onToggle }: { expanded: boolean; onClose: () => void; onToggle: () => void }) {
  const { t } = useI18n();
  const brand = useBrand();
  const { session } = useSession();
  const { isSuperAdmin } = useSuperAdmin();
  const { pathname } = useLocation();
  // Superadmin → grupos de PLATAFORMA (no tenant). Tenant → grupos de siempre (+ Landing si CEO/superadmin y activo).
  const isCeo = session?.role === "ceo" || session?.role === "superadmin";
  const sections = isSuperAdmin ? SUPERADMIN_SECTIONS : brand.landingEnabled && isCeo ? [...SECTIONS, LANDING_SECTION] : SECTIONS;
  const [openSection, setOpenSection] = useState<string>(() => activeSection(pathname, sections));
  useEffect(() => { const s = activeSection(pathname, sections); if (s) setOpenSection(s); }, [pathname]);
  const { count: unseenWeb } = useUnseenWebLeads(pathname);
  const { count: upcomingApts } = useUpcomingAppointments(pathname);
  const { count: unseenOrders } = useOrdersUnseenCount(pathname);
  const { count: lowStock } = useLowStockCount(pathname);
  const { count: assetsDue } = useAssetsDueCount(pathname);
  const { count: notifs } = useNotifCount(pathname);
  const badges = { leads: unseenWeb, agenda: upcomingApts, orders: unseenOrders, inventory: lowStock, assets: assetsDue, notifications: notifs };
  const onNavigate = () => onClose(); // solo un link de página cierra el sidebar
  const panelActive = pathname.startsWith("/dashboard");
  return (
    <>
      {expanded && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} />}
      <aside className={`fixed z-40 flex h-full flex-col border-r border-border bg-sidebar-background transition-all duration-300 md:translate-x-0 ${expanded ? "w-60 translate-x-0" : "w-60 -translate-x-full md:w-16"}`}>
        <button type="button" onClick={onToggle} aria-label={t("menu")} className="flex items-center gap-2 border-b border-border px-4 py-5 text-left">
          {brand.logoUrl
            ? <img src={brand.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">{((brand.displayName || brand.legalName).trim()[0] || "M").toUpperCase()}</span>}
          {expanded && <span className="font-display text-lg font-bold text-foreground">{brand.displayName || brand.legalName || "Mi Negocio"}</span>}
        </button>
        <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
          {!isSuperAdmin && <Link to="/dashboard" onClick={onNavigate} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body ${panelActive ? "font-medium" : "hover:bg-secondary"} ${expanded ? "" : "justify-center"}`}><LayoutDashboard className="h-5 w-5" />{expanded && <span>{t("panel")}</span>}{expanded && panelActive && <Check className="ml-auto h-4 w-4 text-accent" />}</Link>}
          {!isSuperAdmin && <div className="my-1 border-b border-border" />}
          {sections.map((s) => (
            <SidebarSection key={s.title} section={s} expanded={expanded} badges={badges}
              isOpen={openSection === s.title} activePath={pathname}
              onToggleSection={() => setOpenSection(openSection === s.title ? "" : s.title)}
              onExpandAndOpen={() => { if (!expanded) onToggle(); setOpenSection(s.title); }}
              onNavigate={onNavigate} />
          ))}
        </nav>
        {expanded && <SidebarUser />}
      </aside>
    </>
  );
}
