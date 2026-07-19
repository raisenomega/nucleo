import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { PortalNavLink } from "@shared/portal/PortalNavLink";
import type { PortalSection } from "@shared/portal/portal.nav";

// Sección acordeón del sidebar del portal (patrón SidebarSection admin). Auto-abre si un hijo es la ruta activa.
export function PortalSidebarSection({ section, expanded }: { section: PortalSection; expanded: boolean }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const Icon = section.icon;
  const hasActive = section.items.some((n) => n.to && pathname === n.to);
  const [open, setOpen] = useState(hasActive);
  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);
  // Colapsado: solo el icono de la sección (resaltado si algún hijo está activo). Sin acordeón.
  if (!expanded) return (
    <div title={t(section.labelKey)} className={`grid place-items-center rounded-lg py-2 ${hasActive ? "text-primary" : "text-muted-foreground"}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">
        <Icon className="h-4 w-4 shrink-0" /><span className="flex-1 text-left">{t(section.labelKey)}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <div className="mt-1 space-y-1 pl-2">
          {section.items.map((n) => <PortalNavLink key={n.key} item={n} label={t(n.key)} active={pathname === n.to} expanded />)}
        </div>
      )}
    </div>
  );
}
