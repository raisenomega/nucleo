import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { PINNED_ITEMS } from "@shared/components/sidebar.nav";

// Items fijos arriba del sidebar (fuera de grupos): Clientes, Órdenes Web. Gated por su módulo; badge en Órdenes.
export function SidebarPinned({ expanded, pathname, ordersBadge, onNavigate }: {
  expanded: boolean; pathname: string; ordersBadge: number; onNavigate: () => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  return (
    <>{PINNED_ITEMS.map((n) => {
      if (!n.to || (n.mod && !can(n.mod, "view"))) return null;
      const act = pathname.startsWith(n.to); const badge = n.key === "navOrdersWeb" ? ordersBadge : 0;
      return (
        <Link key={n.key} to={n.to} onClick={onNavigate} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body ${act ? "font-medium" : "hover:bg-secondary"} ${expanded ? "" : "justify-center"}`}>
          <n.icon className="h-5 w-5" />{expanded && <span>{t(n.key)}</span>}
          {expanded && act && <Check className="ml-auto h-4 w-4 text-accent" />}
          {expanded && !act && badge > 0 ? <span className="ml-auto rounded-full bg-destructive px-1.5 text-xs font-bold text-white">{badge}</span> : null}
        </Link>
      );
    })}</>
  );
}
