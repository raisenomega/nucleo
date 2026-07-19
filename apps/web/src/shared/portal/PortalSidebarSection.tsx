import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { PortalSection } from "@shared/portal/portal.nav";

// Sección acordeón del sidebar del portal (patrón SidebarSection admin). Auto-abre si un hijo es la ruta activa.
export function PortalSidebarSection({ section }: { section: PortalSection }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const Icon = section.icon;
  const hasActive = section.items.some((n) => n.to && pathname === n.to);
  const [open, setOpen] = useState(hasActive);
  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);
  const item = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm";
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">
        <Icon className="h-4 w-4" /><span className="flex-1 text-left">{t(section.labelKey)}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <div className="mt-1 space-y-1 pl-2">
          {section.items.map((n) => n.to ? (
            <Link key={n.key} to={n.to} className={`${item} ${pathname === n.to ? "bg-secondary font-medium" : "hover:bg-secondary"}`}>
              <n.icon className="h-4 w-4" />{t(n.key)}
            </Link>
          ) : (
            <a key={n.key} href={n.href} className={`${item} hover:bg-secondary`}>
              <n.icon className="h-4 w-4" />{t(n.key)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
