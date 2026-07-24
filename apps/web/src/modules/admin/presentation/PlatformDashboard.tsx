import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, Inbox, Globe, Package, BarChart3, Bot } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { getLeadCounts } from "@raisen-marketing/infrastructure/marketing-leads.repository";
import { getPlatformAnalytics, type PlatformAnalytics } from "@shared/analytics/platform-analytics.repository";

// Dashboard de plataforma del superadmin (no el financiero del tenant). Card "Leads comercial" = leads nuevos
// (grande) + total y calientes (subtítulo), reales de marketing_leads (RLS: solo superadmin). Tenants placeholder.
// Ola 2.8c: + cards de pulso (visitas del sitio con link al panel completo, visibilidad IA) desde el analytics.
export function PlatformDashboard() {
  const { t } = useI18n();
  const [c, setC] = useState<{ total: number; new: number; hot: number } | null>(null);
  const [pa, setPa] = useState<PlatformAnalytics | null>(null);
  useEffect(() => { void getLeadCounts().then(setC); void getPlatformAnalytics(30).then(setPa); }, []);
  const card = "rounded-xl border border-border bg-card p-5";
  const METRICS = [
    { icon: Building2, key: "saTenantsActive" as const, value: "1" },
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
          <Inbox className="h-5 w-5 text-muted-foreground" />
          <p className="mt-3 text-2xl font-bold text-foreground">{c === null ? "…" : c.new}</p>
          <p className="text-xs text-muted-foreground">{t("saLeadsCommercial")}{c && ` · ${c.total} total · ${c.hot} 🔥`}</p>
        </div>
        <Link to="/platform/analytics" className={`${card} block transition hover:border-primary`}>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <p className="mt-3 text-2xl font-bold text-foreground">{pa === null ? "…" : pa.traffic.visits.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t("saSiteVisits")}</p>
        </Link>
        <div className={card}>
          <Bot className="h-5 w-5 text-muted-foreground" />
          <p className="mt-3 text-2xl font-bold text-foreground">{pa === null ? "…" : pa.ai.crawls}</p>
          <p className="text-xs text-muted-foreground">{t("saAiVisibility")}{pa && pa.ai.referrals > 0 && ` · ${pa.ai.referrals} ref.`}</p>
        </div>
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
