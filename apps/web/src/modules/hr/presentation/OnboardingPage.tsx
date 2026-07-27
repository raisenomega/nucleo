import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { StaffOnboarding } from "@hr/presentation/StaffOnboarding";
import { OnboardingDetail } from "@hr/presentation/OnboardingDetail";

// Dual-mode: staff gestiona todos los onboardings + templates; el empleado ve/completa el suyo.
export function OnboardingPage() {
  const { t } = useI18n();
  const { session } = useSession();
  const { canEdit } = useRoleGate();
  const tenantId = session?.tenantId ?? "";
  if (canEdit("coo")) return <StaffOnboarding tenantId={tenantId} />;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("onboarding")}</h1>
      <OnboardingDetail employeeId={session?.userId ?? ""} employeeName="" isStaff={false} tenantId={tenantId} />
    </div>
  );
}
