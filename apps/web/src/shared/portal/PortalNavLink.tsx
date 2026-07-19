import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import type { PortalNavItem } from "@shared/portal/portal.nav";

// Ítem-hoja del sidebar del portal: icono + label (si expandido) + check activo (patrón SidebarSection admin).
// Colapsado (expanded=false) = solo el icono centrado, con el label como title (tooltip).
export function PortalNavLink({ item, label, active, expanded }: { item: PortalNavItem; label: string; active: boolean; expanded: boolean }) {
  const cls = `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${active ? "bg-secondary font-medium" : "hover:bg-secondary"} ${expanded ? "" : "justify-center"}`;
  const inner = (
    <>
      <item.icon className="h-4 w-4 shrink-0" />
      {expanded && <span className="flex-1 truncate">{label}</span>}
      {expanded && active && <Check className="h-4 w-4 shrink-0 text-accent" />}
    </>
  );
  return item.to
    ? <Link to={item.to} title={label} className={cls}>{inner}</Link>
    : <a href={item.href} title={label} className={cls}>{inner}</a>;
}
