import { Outlet, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { PortalNav } from "@shared/portal/PortalNav";
import { PortalNotifBell } from "@shared/portal/PortalNotifBell";
import { signOutCustomer } from "@shared/portal/portal-auth";
import type { CustomerProfile } from "@shared/portal/customer.types";

// Layout del portal: header (logo tenant + nombre + salir) + sidebar desktop + barra inferior mobile + Outlet.
export function PortalShell({ customer, logoUrl, displayName }: { customer: CustomerProfile; logoUrl: string | null; displayName: string }) {
  const { t } = useI18n();
  const nav = useNavigate();
  const out = async () => { await signOutCustomer(); void nav({ to: "/portal/login" }); };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background p-3">
        {logoUrl ? <img src={logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">{(displayName.trim()[0] ?? "N").toUpperCase()}</span>}
        <span className="font-display font-bold">{displayName}</span>
        <div className="flex-1" />
        <span className="hidden text-sm text-muted-foreground sm:inline">{customer.fullName || customer.email}</span>
        <PortalNotifBell />
        <button type="button" onClick={() => void out()} aria-label={t("signOut")} className="rounded-lg p-2 hover:bg-secondary"><LogOut className="h-5 w-5" /></button>
      </header>
      <div className="mx-auto flex w-full max-w-5xl">
        <aside className="hidden w-56 shrink-0 border-r border-border p-2 md:block"><PortalNav variant="side" /></aside>
        <main className="min-w-0 flex-1 p-4 pb-24 md:pb-6"><Outlet /></main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background md:hidden"><PortalNav variant="bottom" /></nav>
    </div>
  );
}
