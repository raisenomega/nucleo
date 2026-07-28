import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useBrand } from "@shared/providers/brand-context";
import { useDemoOwner } from "@shared/providers/demo-owner-context";
import { DemoPinModal } from "@shared/components/DemoPinModal";

// Indicador sutil de "Modo Owner" (solo en tenant demo). Sin verificar → texto tenue que abre el PIN;
// verificado → verde con candado (click desactiva). Reemplaza al banner amarillo grande.
export function OwnerModeIndicator() {
  const { isDemoTenant } = useBrand();
  const { ownerMode, disableOwnerMode } = useDemoOwner();
  const { t } = useI18n();
  const [pin, setPin] = useState(false);
  if (!isDemoTenant) return null;
  return (
    <>
      {ownerMode ? (
        <button type="button" onClick={disableOwnerMode} title={t("demoExitOwner")}
          className="mt-0.5 text-xs font-bold text-green-600 hover:underline">🔓 {t("demoOwnerMode")}</button>
      ) : (
        <button type="button" onClick={() => setPin(true)}
          className="mt-0.5 text-xs text-muted-foreground hover:text-foreground">{t("demoOwnerMode")}</button>
      )}
      {pin && <DemoPinModal onClose={() => setPin(false)} />}
    </>
  );
}
