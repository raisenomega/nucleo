import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { ThemeToggle } from "@shared/components/ThemeToggle";
import { Sidebar } from "@shared/components/Sidebar";
import { useI18n } from "@shared/i18n";
import type { Session } from "@identity/domain/auth.types";

export function AppLayout({ session, onLogout }: { session: Session | null; onLogout: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar session={session} onLogout={onLogout} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border p-4">
          <button type="button" onClick={() => setOpen(true)} aria-label={t("panel")}
            className="rounded-lg bg-secondary p-2 md:hidden">☰</button>
          <div className="flex-1" />
          <ThemeToggle />
          <button type="button" onClick={() => setLocale(locale === "es" ? "en" : "es")}
            aria-label={t("switchLang")} className="rounded-lg bg-secondary text-foreground p-2 font-body">
            {locale === "es" ? "EN" : "ES"}
          </button>
        </header>
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  );
}
