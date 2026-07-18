import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { supabaseAssetRepository } from "@assets/infrastructure/supabase-asset.repository";
import { AssetCustodyHistory } from "@assets/presentation/AssetCustodyHistory";
import { ASSET_TYPE, CONDITION, STATUS, MAINT_TYPE } from "@assets/presentation/asset-labels";
import { assetValue } from "@assets/application/asset-helpers";
import type { Asset, MaintenanceLog } from "@assets/domain/asset.types";

// Detalle del activo: ficha + imagen + custodia + historial de mantenimiento.
export function AssetDetail({ asset, onCheckout, onCheckin, onClose }: { asset: Asset; onCheckout: () => void; onCheckin: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const edit = can("assets", "edit");
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  useEffect(() => { void supabaseAssetRepository.listMaintenance(asset.id).then(setLogs); }, [asset.id]);
  const row = (label: string, v: string) => (v ? <div><dt className="inline text-muted-foreground">{label}: </dt><dd className="inline">{v}</dd></div> : null);
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-foreground">{asset.name}<span className={`rounded px-1.5 py-0.5 text-xs font-bold ${STATUS[asset.status].cls}`}>{t(STATUS[asset.status].key)}</span></h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4 md:p-6">
        {asset.imageUrl && <img src={asset.imageUrl} alt={asset.name} className="max-h-40 rounded-lg border border-border object-cover" />}
        {edit && <div className="flex flex-wrap gap-2">
          {asset.status === "in_use" ? <button type="button" onClick={onCheckin} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold">{t("receiveCheckin")}</button>
            : <button type="button" onClick={onCheckout} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold">{t("assignCheckout")}</button>}
        </div>}
        <dl className="grid grid-cols-1 gap-1 font-body text-sm md:grid-cols-2">
          {row(t("assetType"), t(ASSET_TYPE[asset.assetType]))}{row(t("category"), asset.category)}{row(t("brand"), asset.brand)}{row(t("model"), asset.model)}
          {row(t("serialNumber"), asset.serialNumber)}{row(t("condition"), t(CONDITION[asset.condition]))}{row(t("assignedTo"), asset.assignedToName)}{row(t("location"), asset.location)}
          {can("assets", "cost") ? row(t("currentValue"), formatCurrency(assetValue(asset))) : null}{row(t("warrantyExpires"), asset.warrantyExpires ?? "")}{row(t("insurancePolicy"), asset.insurancePolicy)}{row(t("insuranceExpires"), asset.insuranceExpires ?? "")}
          {row(t("notes"), asset.notes)}
        </dl>
        <AssetCustodyHistory assetId={asset.id} />
        <div className="space-y-1 border-t border-border pt-2">
          <p className="text-xs font-bold uppercase text-muted-foreground">{t("maintenanceHistory")}</p>
          {logs.length === 0 && <p className="text-sm text-muted-foreground">{t("noRecords")}</p>}
          {logs.map((m) => (
            <div key={m.id} className="flex flex-wrap justify-between gap-2 text-sm">
              <span>{m.performedAt} · {t(MAINT_TYPE[m.maintenanceType])}{m.description && ` · ${m.description}`}</span>
              <span className="text-muted-foreground">{can("assets", "cost") && m.cost > 0 ? formatCurrency(m.cost) : ""}{m.nextDue ? ` · ${t("nextDue")} ${m.nextDue}` : ""}</span>
            </div>
          ))}
        </div>
      </div>
    </ScreenModal>
  );
}
