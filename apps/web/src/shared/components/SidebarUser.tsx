import { LogOut } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { Session } from "@identity/domain/auth.types";

export function SidebarUser({ session, onLogout }: { session: Session | null; onLogout: () => void }) {
  const { t } = useI18n();
  return (
    <div className="space-y-2 border-t border-border p-4">
      <div className="font-body text-sm">
        <p className="truncate">{session?.email ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{t("role")}: {session?.role ?? "—"}</p>
      </div>
      <button type="button" onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary text-foreground px-3 py-2 text-sm font-body font-bold hover:bg-primary hover:text-primary-foreground">
        <LogOut className="h-4 w-4" /> {t("logout")}
      </button>
    </div>
  );
}
