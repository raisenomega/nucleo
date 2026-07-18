import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { MAINT_TYPE } from "@assets/presentation/asset-labels";
import type { MaintenanceFormData, MaintenanceType } from "@assets/domain/asset.types";

const today = () => new Date().toISOString().slice(0, 10);

// FIX B — registrar mantenimiento (preventivo/correctivo/inspección) con costo + próximo vencimiento.
export function MaintenanceModal({ assetName, onSubmit, onClose }: {
  assetName: string; onSubmit: (d: MaintenanceFormData) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<MaintenanceFormData>({ maintenanceType: "preventive", description: "", cost: 0, performedBy: "", performedAt: today(), nextDue: null, notes: "" });
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm"; const lbl = "text-xs font-bold text-muted-foreground";
  const go = (e: React.FormEvent) => { e.preventDefault(); onSubmit(f); };
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("registerMaintenance")} · {assetName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={go} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        <label className="space-y-1"><span className={lbl}>{t("maintenanceType")}</span><select value={f.maintenanceType} onChange={(e) => setF({ ...f, maintenanceType: e.target.value as MaintenanceType })} className={fld}>{Object.keys(MAINT_TYPE).map((k) => <option key={k} value={k}>{t(MAINT_TYPE[k as MaintenanceType])}</option>)}</select></label>
        <label className="space-y-1"><span className={lbl}>{t("cost")}</span><input type="number" min="0" step="0.01" value={f.cost || ""} onChange={(e) => setF({ ...f, cost: Number(e.target.value) })} className={fld} /></label>
        <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("description")}</span><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("performedBy")}</span><input value={f.performedBy} onChange={(e) => setF({ ...f, performedBy: e.target.value })} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("performedAt")}</span><input type="date" value={f.performedAt} onChange={(e) => setF({ ...f, performedAt: e.target.value })} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("nextDue")}</span><input type="date" value={f.nextDue ?? ""} onChange={(e) => setF({ ...f, nextDue: e.target.value || null })} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("notes")}</span><input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={fld} /></label>
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
        </div>
      </form>
    </ScreenModal>
  );
}
