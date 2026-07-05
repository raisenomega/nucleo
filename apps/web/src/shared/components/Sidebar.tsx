import { Link, useLocation } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { SECTIONS } from "@shared/components/sidebar.nav";
import { SidebarUser } from "@shared/components/SidebarUser";
import type { Session } from "@identity/domain/auth.types";

export function Sidebar({ session, onLogout, open, onClose }: {
  session: Session | null; onLogout: () => void; open: boolean; onClose: () => void;
}) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const item = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body transition";
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} />}
      <aside className={`fixed z-40 flex h-full w-64 flex-col border-r border-border bg-card transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 border-b border-border px-6 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">N</span>
          <span className="font-display text-lg font-bold text-primary">NÚCLEO</span>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {SECTIONS.map((s) => (
            <div key={s.title} className="space-y-1">
              <p className="px-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t(s.title)}</p>
              {s.items.map((n) => n.to ? (
                <Link key={n.key} to={n.to} onClick={onClose}
                  className={`${item} ${pathname.startsWith(n.to) ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                  <n.icon className="h-4 w-4" /> {t(n.key)}
                </Link>
              ) : (
                <span key={n.key} title={t("comingSoon")} className={`${item} cursor-not-allowed text-muted-foreground opacity-50`}>
                  <n.icon className="h-4 w-4" /> {t(n.key)}
                </span>
              ))}
            </div>
          ))}
        </nav>
        <SidebarUser session={session} onLogout={onLogout} />
      </aside>
    </>
  );
}
