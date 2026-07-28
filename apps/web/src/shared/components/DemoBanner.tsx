import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useBrand } from "@shared/providers/brand-context";
import { useDemoOwner } from "@shared/providers/demo-owner-context";
import { DemoPinModal } from "@shared/components/DemoPinModal";

// Banner fijo del tenant demo. Ámbar = modo demo; verde = modo owner (cambios permanentes).
export function DemoBanner() {
  const { t } = useI18n();
  const { isDemoTenant } = useBrand();
  const { ownerMode, disableOwnerMode } = useDemoOwner();
  const [pin, setPin] = useState(false);
  if (!isDemoTenant) return null;
  return (
    <>
      <div className={`sticky top-0 z-40 flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 text-center text-xs font-bold ${ownerMode ? "bg-green-600 text-white" : "bg-amber-500 text-black"}`}>
        {ownerMode ? (
          <>
            <span>⚡ {t("demoOwnerActive")}</span>
            <button type="button" onClick={disableOwnerMode} className="underline">{t("demoExitOwner")}</button>
          </>
        ) : (
          <>
            <span>⚡ {t("demoBannerText")}</span>
            <button type="button" onClick={() => setPin(true)} className="rounded bg-black/20 px-2 py-0.5 underline">🔑 {t("demoOwnerMode")}</button>
          </>
        )}
      </div>
      {pin && <DemoPinModal onClose={() => setPin(false)} />}
    </>
  );
}
