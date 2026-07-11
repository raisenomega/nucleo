import { Clock, Calendar } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { ServiceDetail } from "@landing-public/domain/landing-service-detail.types";

const chip = "inline-flex items-center gap-1.5 rounded-full border border-[color:var(--glass-border)] px-3 py-1 text-sm";

export function ServiceMetaBadges({ service: s }: { service: ServiceDetail }) {
  const { t } = useI18n();
  if (s.duration_estimate_minutes == null && !s.requires_scheduling) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2" role="status">
      {s.duration_estimate_minutes != null && <span className={chip}><Clock className="h-4 w-4" />{t("lpServiceDuration")}: {s.duration_estimate_minutes} min</span>}
      {s.requires_scheduling && <span className={chip}><Calendar className="h-4 w-4" />{t("lpServiceRequiresScheduling")}</span>}
    </div>
  );
}
