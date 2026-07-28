import { useI18n } from "@shared/i18n";
import type { SecurityDashboardData } from "@shared/security/domain/security.types";
import { SecurityKpiCard } from "./SecurityKpiCard";
import { SeverityBadge } from "./SeverityBadge";
import { fmtDate } from "./security.fmt";

function scoreDot(n: number) { return n >= 90 ? "🟢" : n >= 70 ? "🟡" : "🔴"; }

export function SecurityPanelTab({ data, loading }: { data: SecurityDashboardData | null; loading: boolean }) {
  const { t } = useI18n();
  if (loading || !data) return <p className="text-sm text-muted-foreground">{t("noData")}</p>;
  const sentinel = [{ label: t("secRlsAudit"), s: data.lastRlsAudit }, { label: t("secGlIntegrity"), s: data.lastGlIntegrity }];
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs uppercase text-muted-foreground">{t("secScore")}</p>
        <p className="text-4xl font-bold text-foreground">{scoreDot(data.securityScore)} {data.securityScore}/100</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <SecurityKpiCard label={t("secLoginsToday")} value={data.loginsToday} />
        <SecurityKpiCard label={t("secFailedToday")} value={data.failedLoginsToday} tone={data.failedLoginsToday > 0 ? "warn" : undefined} />
        <SecurityKpiCard label={t("secBruteForce")} value={data.bruteForceAttempts} tone={data.bruteForceAttempts > 0 ? "danger" : undefined} />
        <SecurityKpiCard label={t("secBlockedIps")} value={data.blockedIps} />
        <SecurityKpiCard label={t("secCriticalEvents")} value={data.criticalEvents} tone={data.criticalEvents > 0 ? "danger" : undefined} />
      </div>
      <div>
        <h2 className="mb-2 font-display font-bold text-foreground">{t("secRecentEvents")}</h2>
        <div className="space-y-1">
          {data.recentEvents.slice(0, 8).map((e) => (
            <div key={e.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <SeverityBadge level={e.severity} />
              <span className="font-bold text-foreground">{e.eventType}</span>
              <span className="truncate text-muted-foreground">{e.userName ?? e.ipAddress ?? "—"}</span>
              <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">{fmtDate(e.createdAt)}</span>
            </div>
          ))}
          {data.recentEvents.length === 0 && <p className="text-sm text-muted-foreground">{t("secNoEvents")}</p>}
        </div>
      </div>
      <div>
        <h2 className="mb-2 font-display font-bold text-foreground">{t("secSentinelStatus")}</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {sentinel.map((x) => (
            <div key={x.label} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <span className="font-bold text-foreground">{x.label}: </span>
              {x.s ? <span>{x.s.passed ? "✅" : "🔴"} {x.s.score ?? "—"} · {fmtDate(x.s.scannedAt)}</span> : <span className="text-muted-foreground">{t("secNever")}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
