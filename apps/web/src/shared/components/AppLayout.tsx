import { useState } from "react";
import { Menu } from "lucide-react";
import { Outlet } from "@tanstack/react-router";
import { ThemeToggle } from "@shared/components/ThemeToggle";
import { Sidebar } from "@shared/components/Sidebar";
import { useI18n } from "@shared/i18n";
import type { Session } from "@identity/domain/auth.types";

export function AppLayout({ session, onLogout }: { session: Session | null; onLogout: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar session={session} onLogout={onLogout} expanded={expanded} onClose={() => setExpanded(false)} />
      <div className={`flex min-h-screen flex-col transition-all duration-300 ${expanded ? "md:pl-60" : "md:pl-16"}`}>
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background p-4">
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-label={t("menu")}
            className="rounded-lg bg-secondary p-2 hover:bg-primary hover:text-primary-foreground"><Menu className="h-5 w-5" /></button>
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
