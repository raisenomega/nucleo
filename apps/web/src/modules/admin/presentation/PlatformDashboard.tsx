import { useEffect, useState } from "react";
import { Building2, Inbox, Globe, Package } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { getNewLeadsCount } from "@raisen-marketing/infrastructure/marketing-leads.repository";

// Dashboard de plataforma del superadmin (no el financiero del tenant). Card "Leads comercial" = COUNT real
// de marketing_leads con status 'new' (RLS: solo superadmin lee). Tenants aún placeholder.
export function PlatformDashboard() {
  const { t } = useI18n();
  const [newLeads, setNewLeads] = useState<number | null>(null);
  useEffect(() => { void getNewLeadsCount().then(setNewLeads); }, []);
  const card = "rounded-xl border border-border bg-card p-5";
  const METRICS = [
    { icon: Building2, key: "saTenantsActive" as const, value: "1" },
    { icon: Inbox, key: "saLeadsCommercial" as const, value: newLeads === null ? "…" : String(newLeads) },
  ];
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">NÚCLEO · {t("saPlatform")}</h1>
        <p className="text-xs text-muted-foreground">{t("saPlatformSubtitle")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.key} className={card}>
            <m.icon className="h-5 w-5 text-muted-foreground" />
            <p className="mt-3 text-2xl font-bold text-foreground">{m.value}</p>
            <p className="text-xs text-muted-foreground">{t(m.key)}</p>
          </div>
        ))}
        <div className={card}>
          <Globe className="h-5 w-5 text-muted-foreground" />
          <p className="mt-3 text-2xl font-bold text-foreground">{t("saLandingActive")}</p>
          <a href="https://nucleoraisen.com" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">nucleoraisen.com</a>
        </div>
        <div className={card}>
          <Package className="h-5 w-5 text-muted-foreground" />
          <p className="mt-3 text-2xl font-bold text-foreground">v1.0</p>
          <p className="text-xs text-muted-foreground">NÚCLEO</p>
        </div>
      </div>
    </div>
  );
}
