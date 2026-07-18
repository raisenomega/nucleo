import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { AssetTable } from "@assets/presentation/AssetTable";
import { AssetDetail } from "@assets/presentation/AssetDetail";
import { MaintenanceModal } from "@assets/presentation/MaintenanceModal";
import { useAssets } from "@assets/application/useAssets.hook";
import type { Asset, MaintenanceFormData } from "@assets/domain/asset.types";

type A = ReturnType<typeof useAssets>;

// Bundle: tabla + detalle + modal de mantenimiento (mantiene la ruta liviana).
export function AssetsPanel({ assets, rows, now, onEdit, onDelete }: {
  assets: A; rows: readonly Asset[]; now: Date; onEdit: (id: string) => void; onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [viewing, setViewing] = useState<string | null>(null);
  const [maintaining, setMaintaining] = useState<string | null>(null);
  const view = assets.items.find((a) => a.id === viewing);
  const maint = assets.items.find((a) => a.id === maintaining);
  async function addM(d: MaintenanceFormData) { if (!maintaining) return; const r = await assets.addMaintenance(maintaining, d); if (r.ok) { setMaintaining(null); toast.success(t("saved")); } else toast.error(r.error); }
  return (
    <>
      <AssetTable rows={rows} now={now} onView={setViewing} onEdit={onEdit} onDelete={onDelete} onMaintain={setMaintaining} />
      {view && <AssetDetail asset={view} onClose={() => setViewing(null)} />}
      {maint && <MaintenanceModal assetName={maint.name} onSubmit={addM} onClose={() => setMaintaining(null)} />}
    </>
  );
}
