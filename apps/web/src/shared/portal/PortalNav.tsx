import { Link, useLocation } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { PORTAL_HOME, PORTAL_SUPPORT, PORTAL_SECTIONS, BOTTOM_NAV } from "@shared/portal/portal.nav";
import { PortalSidebarSection } from "@shared/portal/PortalSidebarSection";
import { PortalNavLink } from "@shared/portal/PortalNavLink";

// Navegación del portal: sidebar acordeón (side: Inicio → secciones → Soporte, con estado colapsado/expandido)
// o barra inferior mobile (bottom, 3 ítems). PortalSidebarSection solo se usa en side, nunca en bottom.
export function PortalNav({ variant, expanded = true, onNavigate }: { variant: "side" | "bottom"; expanded?: boolean; onNavigate?: () => void }) {
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
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      <PortalNavLink item={PORTAL_HOME} label={t(PORTAL_HOME.key)} active={pathname === PORTAL_HOME.to} expanded={expanded} onNavigate={onNavigate} />
      <div className="my-1 border-t border-border" />
      {PORTAL_SECTIONS.map((s) => <PortalSidebarSection key={s.key} section={s} expanded={expanded} onNavigate={onNavigate} />)}
      <div className="my-1 border-t border-border" />
      <PortalNavLink item={PORTAL_SUPPORT} label={t(PORTAL_SUPPORT.key)} active={pathname === PORTAL_SUPPORT.to} expanded={expanded} onNavigate={onNavigate} />
    </nav>
  );
}
