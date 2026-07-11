import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import type { NavSection } from "@shared/components/sidebar.nav";

export function SidebarSection({ section, expanded, isOpen, activePath, onToggleSection, onExpandAndOpen, onNavigate }: {
  section: NavSection; expanded: boolean; isOpen: boolean; activePath: string;
  onToggleSection: () => void; onExpandAndOpen: () => void; onNavigate: () => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const Icon = section.icon;
  const item = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body transition";
  const isActive = (to: string) => activePath === to || activePath.startsWith(to + "/");
  // Ruteado -> can(mod,"view"); "próximamente" (sin to) -> solo roadmap (can settings.view = coo/ceo).
  const items = section.items.filter((n) => n.to ? (n.mod ? can(n.mod, "view") : true) : can("settings", "view"));
  const hasActiveChild = items.some((n) => n.to && isActive(n.to));
  if (items.length === 0) return null;
  if (!expanded) {
    // Colapsado: click en el icono abre el sidebar + su sección. No navega, no cierra.
    return (
      <button type="button" onClick={onExpandAndOpen} title={t(section.title)} className="grid w-full place-items-center py-2 text-muted-foreground hover:text-foreground">
        <Icon className="h-5 w-5" />
      </button>
    );
  }
  return (
    <div>
      <button type="button" onClick={onToggleSection}
        className={`flex w-full cursor-pointer items-center gap-2 border-l-2 border-solid px-3 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 ${hasActiveChild ? "border-accent" : "border-transparent"}`}>
        <Icon className="h-4 w-4" /><span className="flex-1 text-left">{t(section.title)}</span>
        {isOpen ? <ChevronDown className="ml-auto h-4 w-4 fill-current text-gray-400" /> : <ChevronRight className="ml-auto h-4 w-4 fill-current text-gray-400" />}
      </button>
      {isOpen && items.map((n) => n.to ? (
        <Link key={n.key} to={n.to} onClick={onNavigate}
          className={`${item} ${isActive(n.to) ? "font-medium" : "hover:bg-secondary"}`}>
          <n.icon className="h-4 w-4" /> {t(n.key)}
          {isActive(n.to) && <Check className="ml-auto h-4 w-4 text-accent" />}
        </Link>
      ) : (
        <span key={n.key} title={t("comingSoon")} className={`${item} cursor-not-allowed text-muted-foreground opacity-50`}>
          <n.icon className="h-4 w-4" /> {t(n.key)}
        </span>
      ))}
    </div>
  );
}
