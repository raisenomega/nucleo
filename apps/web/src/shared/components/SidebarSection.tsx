import { ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import type { NavSection } from "@shared/components/sidebar.nav";

export function SidebarSection({ section, expanded, isOpen, activePath, onToggle, onNavigate }: {
  section: NavSection; expanded: boolean; isOpen: boolean; activePath: string;
  onToggle: () => void; onNavigate: () => void;
}) {
  const { t } = useI18n();
  const Icon = section.icon;
  const item = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-body transition";
  if (!expanded) {
    return <div className="grid place-items-center py-2" title={t(section.title)}><Icon className="h-5 w-5 text-muted-foreground" /></div>;
  }
  return (
    <div>
      <button type="button" onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">
        <Icon className="h-4 w-4" /><span className="flex-1 text-left">{t(section.title)}</span>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {isOpen && section.items.map((n) => n.to ? (
        <Link key={n.key} to={n.to} onClick={onNavigate}
          className={`${item} ${activePath.startsWith(n.to) ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
          <n.icon className="h-4 w-4" /> {t(n.key)}
        </Link>
      ) : (
        <span key={n.key} title={t("comingSoon")} className={`${item} cursor-not-allowed text-muted-foreground opacity-50`}>
          <n.icon className="h-4 w-4" /> {t(n.key)}
        </span>
      ))}
    </div>
  );
}
