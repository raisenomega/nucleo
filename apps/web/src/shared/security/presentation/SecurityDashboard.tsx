import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { supabaseSecurityRepository as repo } from "@shared/security/infrastructure/supabase-security.repository";
import { useSecurityDashboard } from "@shared/security/application/useSecurityDashboard.hook";
import { SecurityPanelTab } from "./SecurityPanelTab";
import { SecurityAuditTab } from "./SecurityAuditTab";
import { SecurityEventsTab } from "./SecurityEventsTab";
import { SecurityWatchlistTab } from "./SecurityWatchlistTab";
import { SecuritySentinelTab } from "./SecuritySentinelTab";
import { SecurityHermesTab } from "./SecurityHermesTab";

const TABS: { id: string; k: TranslationKey }[] = [
  { id: "panel", k: "secTabPanel" }, { id: "audit", k: "secTabAudit" }, { id: "events", k: "secTabEvents" },
  { id: "watch", k: "secTabWatchlist" }, { id: "sentinel", k: "secTabSentinel" }, { id: "hermes", k: "secTabHermes" },
];

export function SecurityDashboard() {
  const { t } = useI18n();
  const [tab, setTab] = useState("panel");
  const { data, scans, loading, refresh } = useSecurityDashboard(repo);
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("saSecurity")}</h1>
        <p className="text-sm text-muted-foreground">{t("secSubtitle")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border">
        {TABS.map((x) => (
          <button key={x.id} type="button" onClick={() => setTab(x.id)}
            className={`px-3 py-2 text-sm font-bold ${tab === x.id ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}>{t(x.k)}</button>
        ))}
      </div>
      {tab === "panel" && <SecurityPanelTab data={data} loading={loading} />}
      {tab === "audit" && <SecurityAuditTab repo={repo} />}
      {tab === "events" && <SecurityEventsTab repo={repo} onChange={refresh} />}
      {tab === "watch" && <SecurityWatchlistTab items={data?.activeWatchlist ?? []} repo={repo} onChange={refresh} />}
      {tab === "sentinel" && <SecuritySentinelTab scans={scans} repo={repo} onChange={refresh} />}
      {tab === "hermes" && <SecurityHermesTab repo={repo} />}
    </div>
  );
}
