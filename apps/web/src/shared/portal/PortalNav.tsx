import { Link, useLocation } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { PORTAL_NAV, BOTTOM_NAV } from "@shared/portal/portal.nav";

// Navegación del portal: sidebar (side) con ítems próximamente deshabilitados, o barra inferior mobile (bottom).
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
  return (
    <div className="space-y-1">
      {PORTAL_NAV.map((n) => n.to ? (
        <Link key={n.key} to={n.to} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${pathname === n.to ? "bg-secondary font-medium" : "hover:bg-secondary"}`}>
          <n.icon className="h-4 w-4" />{t(n.key)}
        </Link>
      ) : (
        <span key={n.key} title={t("pComingSoon")} className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-50">
          <n.icon className="h-4 w-4" />{t(n.key)}
        </span>
      ))}
    </div>
  );
}
