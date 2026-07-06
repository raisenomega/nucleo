import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useAdmin } from "@admin/application/useAdmin.hook";
import { supabaseAdminRepository } from "@admin/infrastructure/supabase-admin.repository";
import { AdminTeamTab } from "@admin/presentation/AdminTeamTab";
import { AdminCategoriesTab } from "@admin/presentation/AdminCategoriesTab";
import { AdminSettingsTab } from "@admin/presentation/AdminSettingsTab";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

type Tab = "team" | "categories" | "general";

function SettingsPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const m = useAdmin(supabaseAdminRepository);
  const isCeo = can("settings", "edit");
  const [tab, setTab] = useState<Tab>(isCeo ? "team" : "categories");

  if (!can("settings", "view")) return <Navigate to="/dashboard" />;

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "team", label: t("team"), show: isCeo },
    { id: "categories", label: t("categories"), show: true },
    { id: "general", label: t("generalSettings"), show: isCeo },
  ];
  return (
    <div className="space-y-6 p-8">
      <h1 className="font-display text-3xl font-bold text-primary">{t("settings")}</h1>
      <div className="flex flex-wrap gap-2 border-b border-border">
        {tabs.filter((x) => x.show).map((x) => (
          <button key={x.id} type="button" onClick={() => setTab(x.id)}
            className={`px-4 py-2 text-sm font-bold ${tab === x.id ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{x.label}</button>
        ))}
      </div>
      {tab === "team" && isCeo && <AdminTeamTab team={m.team} onInvite={m.invite} onStatus={m.setStatus} onRole={m.changeRole} />}
      {tab === "categories" && <AdminCategoriesTab categories={m.categories} onSave={m.saveCategory} onToggle={m.toggleCategory} />}
      {tab === "general" && isCeo && <AdminSettingsTab settings={m.settings} onSave={m.upsertSetting} />}
    </div>
  );
}
