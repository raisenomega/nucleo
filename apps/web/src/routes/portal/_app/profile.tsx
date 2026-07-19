import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { usePortal } from "@shared/portal/portal-context";
import { PortalProfileForm } from "@shared/portal/PortalProfileForm";

export const Route = createFileRoute("/portal/_app/profile")({ component: PortalProfilePage });

function PortalProfilePage() {
  const { t } = useI18n();
  const { customer, refresh } = usePortal();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("pMyProfile")}</h1>
      <PortalProfileForm profile={customer} onSaved={refresh} />
    </div>
  );
}
