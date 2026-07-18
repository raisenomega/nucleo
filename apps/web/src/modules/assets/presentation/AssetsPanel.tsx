import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { AssetTable } from "@assets/presentation/AssetTable";
import { AssetDetail } from "@assets/presentation/AssetDetail";
import { MaintenanceModal } from "@assets/presentation/MaintenanceModal";
import { CheckoutModal } from "@assets/presentation/CheckoutModal";
import { CheckinModal } from "@assets/presentation/CheckinModal";
import { useAssets } from "@assets/application/useAssets.hook";
import type { Asset, MaintenanceFormData, CheckoutData, CheckinData, ProfileRef } from "@assets/domain/asset.types";

type A = ReturnType<typeof useAssets>;

// Bundle: tabla + detalle + modales (mantenimiento/checkout/checkin). Mantiene la ruta liviana.
export function AssetsPanel({ assets, rows, now, profiles, onEdit, onDelete }: {
  assets: A; rows: readonly Asset[]; now: Date; profiles: readonly ProfileRef[]; onEdit: (id: string) => void; onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [viewing, setViewing] = useState<string | null>(null);
  const [maintaining, setMaintaining] = useState<string | null>(null);
  const [flow, setFlow] = useState<{ id: string; mode: "out" | "in" } | null>(null);
  const find = (id: string | null | undefined) => assets.items.find((a) => a.id === id);
  const view = find(viewing); const maint = find(maintaining); const fa = find(flow?.id);
  async function addM(d: MaintenanceFormData) { if (!maintaining) return; const r = await assets.addMaintenance(maintaining, d); if (r.ok) { setMaintaining(null); toast.success(t("saved")); } else toast.error(r.error); }
  async function doOut(d: CheckoutData) { if (!flow) return; const r = await assets.checkout(flow.id, d); if (r.ok) { setFlow(null); setViewing(null); toast.success(t("saved")); } else toast.error(r.error); }
  async function doIn(d: CheckinData) { if (!flow) return; const r = await assets.checkin(flow.id, d); if (r.ok) { setFlow(null); setViewing(null); toast.success(t("saved")); } else toast.error(r.error); }
  return (
    <>
      <AssetTable rows={rows} now={now} onView={setViewing} onEdit={onEdit} onDelete={onDelete} onMaintain={setMaintaining} />
      {view && <AssetDetail asset={view} onCheckout={() => setFlow({ id: view.id, mode: "out" })} onCheckin={() => setFlow({ id: view.id, mode: "in" })} onClose={() => setViewing(null)} />}
      {maint && <MaintenanceModal assetName={maint.name} onSubmit={addM} onClose={() => setMaintaining(null)} />}
      {fa && flow?.mode === "out" && <CheckoutModal assetName={fa.name} profiles={profiles} onSubmit={doOut} onClose={() => setFlow(null)} />}
      {fa && flow?.mode === "in" && <CheckinModal assetId={fa.id} assetName={fa.name} onSubmit={doIn} onClose={() => setFlow(null)} />}
    </>
  );
}
