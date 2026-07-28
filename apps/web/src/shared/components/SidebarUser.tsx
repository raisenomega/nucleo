import { useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "@shared/components/ThemeToggle";
import { DemoPinModal } from "@shared/components/DemoPinModal";
import { useI18n } from "@shared/i18n";
import { supabase } from "@shared/lib/supabase";
import { hostKind } from "@shared/seo/host";
import { useSession } from "@shared/providers/SessionProvider";
import { useBrand } from "@shared/providers/brand-context";
import { useDemoOwner } from "@shared/providers/demo-owner-context";

export function SidebarUser() {
  const { t, locale, setLocale } = useI18n();
  const { session } = useSession();
  const { isDemoTenant } = useBrand();
  const { ownerMode } = useDemoOwner();
  const navigate = useNavigate();
  const [pin, setPin] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const goSettings = () => void navigate({ to: "/settings" });
  // En demo sin owner: la rueda pide PIN antes de abrir Ajustes.
  const onSettings = () => { if (isDemoTenant && !ownerMode) setPin(true); else goSettings(); };
  async function onLogout() {
    // Overlay + navegación dura (replace) para eliminar el flash de /login que provoca el Guard
    // al perder la sesión antes de que la landing pública tome el control.
    setLoggingOut(true);
    void supabase.rpc("log_logout"); // fire-and-forget mientras hay sesión (el builder resuelve con {error}, no rechaza)
    await supabase.auth.signOut();
    window.location.replace(hostKind() === "panel" ? "/login" : "/");
  }
  return (
    <div className="space-y-2 border-t border-border p-4">
      {loggingOut && <div className="fixed inset-0 z-[9999] bg-background" />}
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
        <button type="button" onClick={onSettings} aria-label={t("systemSettings")} title={t("systemSettings")}
          className="rounded-lg bg-secondary p-2 text-foreground"><Settings className="h-5 w-5" /></button>
      </div>
      <button type="button" onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary text-foreground px-3 py-2 text-sm font-body font-bold hover:bg-primary hover:text-primary-foreground">
        <LogOut className="h-4 w-4" /> {t("logout")}
      </button>
      {pin && <DemoPinModal onClose={() => setPin(false)} onSuccess={goSettings} />}
    </div>
  );
}
