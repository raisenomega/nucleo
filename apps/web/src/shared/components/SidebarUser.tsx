import { LogOut, Settings } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "@shared/components/ThemeToggle";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";

export function SidebarUser() {
  const { t, locale, setLocale } = useI18n();
  const { session, signOut } = useSession();
  const navigate = useNavigate();
  async function onLogout() {
    await signOut();
    void navigate({ to: "/login" });
  }
  return (
    <div className="space-y-2 border-t border-border p-4">
      <div className="font-body text-sm">
        <p className="truncate">{session?.email ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{t("role")}: {session?.role ?? "—"}</p>
      </div>
      <div className="flex gap-2">
        <ThemeToggle />
        <button type="button" onClick={() => setLocale(locale === "es" ? "en" : "es")}
          aria-label={t("switchLang")} className="rounded-lg bg-secondary text-foreground p-2 font-body">
          {locale === "es" ? "EN" : "ES"}
        </button>
        <Link to="/settings" aria-label={t("systemSettings")} title={t("systemSettings")}
          className="rounded-lg bg-secondary p-2 text-foreground"><Settings className="h-5 w-5" /></Link>
      </div>
      <button type="button" onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary text-foreground px-3 py-2 text-sm font-body font-bold hover:bg-primary hover:text-primary-foreground">
        <LogOut className="h-4 w-4" /> {t("logout")}
      </button>
    </div>
  );
}
