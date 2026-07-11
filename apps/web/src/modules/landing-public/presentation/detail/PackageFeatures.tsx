import { Check } from "lucide-react";
import { useI18n } from "@shared/i18n";

export function PackageFeatures({ features }: { features: string[] }) {
  const { t } = useI18n();
  return (
    <div>
      <h3 className="mb-3 font-bold">{t("lpPackageFeaturesTitle")}</h3>
      <ul className="space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />{f}</li>
        ))}
      </ul>
    </div>
  );
}
