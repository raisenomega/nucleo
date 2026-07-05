import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { SECTIONS } from "@shared/components/sidebar.nav";
import { SidebarSection } from "@shared/components/SidebarSection";
import { SidebarUser } from "@shared/components/SidebarUser";
import type { Session } from "@identity/domain/auth.types";

function activeSection(pathname: string): string {
  const s = SECTIONS.find((sec) => sec.items.some((i) => i.to && pathname.startsWith(i.to)));
  return s ? s.title : "";
}

export function Sidebar({ session, onLogout, expanded, onClose }: {
  session: Session | null; onLogout: () => void; expanded: boolean; onClose: () => void;
}) {
  const { pathname } = useLocation();
  const [openSection, setOpenSection] = useState<string>(() => activeSection(pathname));
  useEffect(() => { const s = activeSection(pathname); if (s) setOpenSection(s); }, [pathname]);
  // Al navegar: cierra el sidebar solo en mobile; en desktop persiste hasta el toggle manual.
  const onNavigate = () => { if (window.innerWidth < 768) onClose(); };
  return (
    <>
      {expanded && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} />}
      <aside className={`fixed z-40 flex h-full flex-col border-r border-border bg-card transition-all duration-300 md:translate-x-0 ${expanded ? "w-60 translate-x-0" : "w-60 -translate-x-full md:w-16"}`}>
        <div className="flex items-center gap-2 border-b border-border px-4 py-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">N</span>
          {expanded && <span className="font-display text-lg font-bold text-primary">NÚCLEO</span>}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {SECTIONS.map((s) => (
            <SidebarSection key={s.title} section={s} expanded={expanded}
              isOpen={openSection === s.title} activePath={pathname}
              onToggle={() => setOpenSection(openSection === s.title ? "" : s.title)}
              onNavigate={onNavigate} />
          ))}
        </nav>
        {expanded && <SidebarUser session={session} onLogout={onLogout} />}
      </aside>
    </>
  );
}
