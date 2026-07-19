import { Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";

// Placeholder de los editores CMS del superadmin (S4-S6). Gate: si no es superadmin → redirect a /dashboard.
export function PlatformPlaceholder({ titleKey }: { titleKey: TranslationKey }) {
  const { t } = useI18n();
  const { isSuperAdmin } = useSuperAdmin();
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">{t(titleKey)}</h1>
      <p className="text-muted-foreground">{t("comingSoonCms")}</p>
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />{t("panel")}
      </Link>
    </div>
  );
}
