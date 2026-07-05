import { Link, useLocation } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import type { Session } from "@identity/domain/auth.types";

const ENABLED = [
  { to: "/dashboard", key: "panel", icon: "📊" },
  { to: "/income", key: "income", icon: "💰" },
] as const;
const SOON: { key: TranslationKey; icon: string }[] = [
  { key: "expenses", icon: "💸" }, { key: "payroll", icon: "📋" }, { key: "routes", icon: "🚛" },
  { key: "inventory", icon: "📦" }, { key: "leads", icon: "👥" }, { key: "marketing", icon: "📈" },
  { key: "reports", icon: "📊" },
];

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
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {ENABLED.map((n) => (
            <Link key={n.to} to={n.to} onClick={onClose}
              className={`${item} ${pathname.startsWith(n.to) ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
              <span>{n.icon}</span> {t(n.key)}
            </Link>
          ))}
          {SOON.map((n) => (
            <span key={n.key} title={t("comingSoon")} className={`${item} cursor-not-allowed text-muted-foreground opacity-50`}>
              <span>{n.icon}</span> {t(n.key)}
            </span>
          ))}
        </nav>
        <div className="space-y-2 border-t border-border p-4">
          <div className="font-body text-sm">
            <p className="truncate">{session?.email ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{t("role")}: {session?.role ?? "—"}</p>
          </div>
          <button type="button" onClick={onLogout}
            className="w-full rounded-lg bg-secondary text-foreground px-3 py-2 text-sm font-body font-bold hover:bg-primary hover:text-primary-foreground">
            {t("logout")}
          </button>
        </div>
      </aside>
    </>
  );
}
