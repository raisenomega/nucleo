import { useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { AvailabilitySection } from "@agenda/presentation/AvailabilitySection";
import { BlocksSection } from "@agenda/presentation/BlocksSection";
import { ServicesSection } from "@agenda/presentation/ServicesSection";

type Tab = "availability" | "blocks" | "services";
const TABS: [Tab, TranslationKey][] = [["availability", "agendaAvailability"], ["blocks", "agendaBlocks"], ["services", "agendaReservableServices"]];

export function AgendaSettingsPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const [tab, setTab] = useState<Tab>("availability");
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("agendaTitle")}</h1>
      <div role="tablist" className="flex gap-1 border-b border-border">
        {TABS.map(([k, lbl]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`px-3 py-2 text-sm font-medium ${tab === k ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}>{t(lbl)}</button>))}
      </div>
      {tab === "availability" && <AvailabilitySection />}
      {tab === "blocks" && <BlocksSection />}
      {tab === "services" && <ServicesSection />}
    </div>
  );
}
