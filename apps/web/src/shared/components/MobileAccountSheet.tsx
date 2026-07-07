import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { SidebarUser } from "@shared/components/SidebarUser";
import { useModalBack } from "@shared/hooks/useModalBack";

// Sheet inferior de cuenta: reusa SidebarUser (email/rol + tema + ES/EN + logout).
export function MobileAccountSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  useModalBack(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:hidden" onClick={onClose}>
      <div className="animate-slide-up w-full rounded-t-2xl border-t border-border bg-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="font-body font-bold text-primary">{t("account")}</span>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-5 w-5" /></button>
        </div>
        <SidebarUser />
      </div>
    </div>
  );
}
