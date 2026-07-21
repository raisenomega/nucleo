import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { PaymentMethodsSection } from "@landing/presentation/PaymentMethodsSection";

export const Route = createFileRoute("/_authenticated/settings/landing/payment-methods")({ component: Page });

function Page() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("landing")} · {t("landingPaymentMethods")}</h1>
      <p className="text-sm text-muted-foreground">Configura cómo cobras en tu tienda. Los métodos activos aparecen en el checkout.</p>
      <PaymentMethodsSection />
    </div>
  );
}
