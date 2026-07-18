import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "@shared/components/Sidebar";
import { MobileNav } from "@shared/components/MobileNav";
import { GpsIndicator } from "@shared/gps/GpsIndicator";
import { GpsResilience } from "@shared/gps/GpsResilience";
import { useI18n } from "@shared/i18n";

export function AppLayout() {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <GpsResilience />
      <Sidebar expanded={expanded} onClose={() => setExpanded(false)} onToggle={() => setExpanded((v) => !v)} />
      <div className={`flex min-h-screen flex-col transition-all duration-300 ${expanded ? "md:pl-60" : "md:pl-16"}`}>
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background p-3 md:p-4">
          <GpsIndicator />
          <div className="flex-1" />
          <button type="button"
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-semibold">
            <MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">{t("aiChat")}</span>
          </button>
        </header>
        <main className="min-w-0 flex-1 bg-card pb-20 md:pb-0"><Outlet /></main>
      </div>
      <MobileNav />
    </div>
  );
}
