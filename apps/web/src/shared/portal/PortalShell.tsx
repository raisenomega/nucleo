import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Sun, Moon, User, Settings } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { PortalNav } from "@shared/portal/PortalNav";
import { PortalNotifBell } from "@shared/portal/PortalNotifBell";
import { signOutCustomer } from "@shared/portal/portal-auth";
import { applySavedTheme, toggleTheme, isDark } from "@shared/portal/portal-theme";
import type { CustomerProfile } from "@shared/portal/customer.types";

// Layout: header (logo + toggle tema + campanita) + sidebar acordeón con footer (perfil/config/salir) + bottom nav.
// Footer del sidebar es desktop (md+); en mobile config+salir viven en el header (md:hidden) para no dejar varado al cliente.
export function PortalShell({ customer, logoUrl, displayName }: { customer: CustomerProfile; logoUrl: string | null; displayName: string }) {
  const { t, setLocale } = useI18n();
  const nav = useNavigate();
  const [dark, setDark] = useState(false);
  useEffect(() => { applySavedTheme(); setDark(isDark()); }, []);
  useEffect(() => { if (customer.language === "es" || customer.language === "en") setLocale(customer.language); }, [customer.language, setLocale]);
  const out = async () => { await signOutCustomer(); void nav({ to: "/portal/login" }); };
  const flip = () => { toggleTheme(); setDark(isDark()); };
  const ico = "grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary";
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background p-3">
        {logoUrl ? <img src={logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">{(displayName.trim()[0] ?? "N").toUpperCase()}</span>}
        <span className="font-display font-bold">{displayName}</span>
        <div className="flex-1" />
        <button type="button" onClick={flip} aria-label={t("pTheme")} className={ico}>{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
        <PortalNotifBell />
        <span className="mx-1 hidden text-sm text-muted-foreground sm:inline">{customer.fullName || customer.email}</span>
        <Link to="/portal/settings" aria-label={t("navSettings")} className={`${ico} md:hidden`}><Settings className="h-5 w-5" /></Link>
        <button type="button" onClick={() => void out()} aria-label={t("signOut")} className={`${ico} md:hidden`}><LogOut className="h-5 w-5" /></button>
      </header>
      <div className="mx-auto flex w-full max-w-5xl flex-1">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border md:flex">
          <PortalNav variant="side" />
          <div className="flex items-center gap-2 border-t border-border p-3">
            <Link to="/portal/profile" aria-label={t("navProfile")} className={ico}><User className="h-5 w-5" /></Link>
            <Link to="/portal/settings" aria-label={t("navSettings")} className={ico}><Settings className="h-5 w-5" /></Link>
            <div className="flex-1" />
            <button type="button" onClick={() => void out()} aria-label={t("signOut")} className={ico}><LogOut className="h-5 w-5" /></button>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 pb-24 md:pb-6"><Outlet /></main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background md:hidden"><PortalNav variant="bottom" /></nav>
    </div>
  );
}
