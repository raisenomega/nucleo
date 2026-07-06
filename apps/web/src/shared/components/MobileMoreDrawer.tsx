import { X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import type { NavEntry } from "@shared/components/MobileNav";

// Drawer inferior con los módulos que no caben en la barra. Sube con animación.
export function MobileMoreDrawer({ items, onClose }: { items: NavEntry[]; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:hidden" onClick={onClose}>
      <div className="animate-slide-up mobile-nav w-full space-y-1 rounded-t-2xl border-t border-border bg-card p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-body font-bold text-primary">{t("more")}</span>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-5 w-5" /></button>
        </div>
        {items.map((n) => (
          <Link key={n.to} to={n.to} onClick={onClose} className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-body hover:bg-secondary">
            <n.icon className="h-5 w-5 text-primary" /> {t(n.key)}
          </Link>
        ))}
      </div>
    </div>
  );
}
