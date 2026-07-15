import { useI18n } from "@shared/i18n";

// Banner de modo preview (CEO viendo una página, activa o inactiva).
export function ServicePagePreviewBanner({ active }: { active: boolean }) {
  const { t } = useI18n();
  return (
    <div className="bg-yellow-400 px-6 py-2 text-center text-sm font-bold text-black">
      {t("spPreviewMode")} · {active ? t("active") : t("spInactive")}
    </div>
  );
}
