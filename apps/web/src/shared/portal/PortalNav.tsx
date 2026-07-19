import { Link, useLocation } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { PORTAL_HOME, PORTAL_SUPPORT, PORTAL_SECTIONS, BOTTOM_NAV, type PortalNavItem } from "@shared/portal/portal.nav";
import { PortalSidebarSection } from "@shared/portal/PortalSidebarSection";

// Navegación del portal: sidebar acordeón (side: Inicio fijo → secciones → Soporte) o barra inferior mobile (bottom).
export function PortalNav({ variant }: { variant: "side" | "bottom" }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  if (variant === "bottom") return (
    <div className="flex justify-around">
      {BOTTOM_NAV.map((n) => n.to ? (
        <Link key={n.key} to={n.to} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${pathname === n.to ? "text-primary" : "text-muted-foreground"}`}>
          <n.icon className="h-5 w-5" />{t(n.key)}
        </Link>) : null)}
    </div>
  );
  const link = (n: PortalNavItem) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${pathname === n.to ? "bg-secondary font-medium" : "hover:bg-secondary"}`;
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      <Link to={PORTAL_HOME.to!} className={link(PORTAL_HOME)}><PORTAL_HOME.icon className="h-4 w-4" />{t(PORTAL_HOME.key)}</Link>
      <div className="my-1 border-t border-border" />
      {PORTAL_SECTIONS.map((s) => <PortalSidebarSection key={s.key} section={s} />)}
      <div className="my-1 border-t border-border" />
      <Link to={PORTAL_SUPPORT.to!} className={link(PORTAL_SUPPORT)}><PORTAL_SUPPORT.icon className="h-4 w-4" />{t(PORTAL_SUPPORT.key)}</Link>
    </nav>
  );
}
