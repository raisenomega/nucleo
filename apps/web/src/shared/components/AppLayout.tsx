import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "@shared/components/Sidebar";
import { useI18n } from "@shared/i18n";

export function AppLayout() {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar expanded={expanded} onClose={() => setExpanded(false)} onToggle={() => setExpanded((v) => !v)} />
      <div className={`flex min-h-screen flex-col transition-all duration-300 ${expanded ? "md:pl-60" : "md:pl-16"}`}>
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background p-4">
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-label={t("menu")}
            className="rounded-lg bg-secondary p-2 hover:bg-primary hover:text-primary-foreground">
            {expanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
          <div className="flex-1" />
          <button type="button"
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-semibold">
            <MessageCircle className="h-4 w-4" /> {t("aiChat")}
          </button>
        </header>
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  );
}
