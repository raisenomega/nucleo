import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useBrand } from "@shared/providers/BrandProvider";
import { SECTIONS } from "@shared/components/sidebar.nav";
import { SidebarSection } from "@shared/components/SidebarSection";
import { SidebarUser } from "@shared/components/SidebarUser";

function activeSection(pathname: string): string {
  const s = SECTIONS.find((sec) => sec.items.some((i) => i.to && pathname.startsWith(i.to)));
  return s ? s.title : "";
}

export function Sidebar({ expanded, onClose, onToggle }: { expanded: boolean; onClose: () => void; onToggle: () => void }) {
  const { t } = useI18n();
  const brand = useBrand();
  const { pathname } = useLocation();
  const [openSection, setOpenSection] = useState<string>(() => activeSection(pathname));
  useEffect(() => { const s = activeSection(pathname); if (s) setOpenSection(s); }, [pathname]);
  const onNavigate = () => onClose(); // solo un link de página cierra el sidebar
  const panelActive = pathname.startsWith("/dashboard");
  return (
    <>
      {expanded && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} />}
      <aside className={`fixed z-40 flex h-full flex-col border-r border-border bg-card transition-all duration-300 md:translate-x-0 ${expanded ? "w-60 translate-x-0" : "w-60 -translate-x-full md:w-16"}`}>
        <button type="button" onClick={onToggle} aria-label={t("menu")} className="flex items-center gap-2 border-b border-border px-4 py-5 text-left">
          {brand.logoUrl
            ? <img src={brand.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">{((brand.displayName || brand.legalName).trim()[0] || "M").toUpperCase()}</span>}
          {expanded && <span className="font-display text-lg font-bold text-primary">{brand.displayName || brand.legalName || "Mi Negocio"}</span>}
        </button>
        <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
          <Link to="/dashboard" onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body ${panelActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"} ${expanded ? "" : "justify-center"}`}>
            <LayoutDashboard className="h-5 w-5" />{expanded && <span>{t("panel")}</span>}
          </Link>
          <div className="my-1 border-b border-border" />
          {SECTIONS.map((s) => (
            <SidebarSection key={s.title} section={s} expanded={expanded}
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
