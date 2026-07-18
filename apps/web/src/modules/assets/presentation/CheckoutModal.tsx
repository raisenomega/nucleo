import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { ScreenModal } from "@shared/components/ScreenModal";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import { FUEL } from "@assets/presentation/asset-labels";
import type { CheckoutData, ProfileRef } from "@assets/domain/asset.types";

// Checkout: el empleado toma la unidad — odómetro/gasolina/GPS/fotos al salir.
export function CheckoutModal({ assetName, profiles, onSubmit, onClose }: {
  assetName: string; profiles: readonly ProfileRef[]; onSubmit: (d: CheckoutData) => void; onClose: () => void;
}) {
  const { t } = useI18n(); const { session } = useSession();
  const [f, setF] = useState<CheckoutData>({ employeeId: "", odometer: null, fuelLevel: "full", fuelType: "", gps: false, notes: "", evidence: [] });
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm"; const lbl = "text-xs font-bold text-muted-foreground";
  const go = (e: React.FormEvent) => { e.preventDefault(); if (!f.employeeId) return; onSubmit(f); };
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("assignCheckout")} · {assetName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={go} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        <label className="space-y-1"><span className={lbl}>{t("employee")}</span><select value={f.employeeId} onChange={(e) => setF({ ...f, employeeId: e.target.value })} className={fld} required><option value="">—</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="space-y-1"><span className={lbl}>{t("odometer")}</span><input type="number" min="0" value={f.odometer ?? ""} onChange={(e) => setF({ ...f, odometer: e.target.value ? Number(e.target.value) : null })} className={fld} required /></label>
        <label className="space-y-1"><span className={lbl}>{t("fuelLevel")}</span><select value={f.fuelLevel} onChange={(e) => setF({ ...f, fuelLevel: e.target.value })} className={fld}>{FUEL.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}</select></label>
        <label className="space-y-1"><span className={lbl}>{t("fuelType")}</span><input value={f.fuelType} onChange={(e) => setF({ ...f, fuelType: e.target.value })} className={fld} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.gps} onChange={(e) => setF({ ...f, gps: e.target.checked })} className="h-4 w-4" /> {t("gpsEnabled")}</label>
        <label className="space-y-1"><span className={lbl}>{t("notes")}</span><input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={fld} /></label>
        <div className="space-y-1 md:col-span-2"><span className={lbl}>{t("exitPhotos")}</span><EvidenceUpload tenantId={session?.tenantId ?? ""} value={f.evidence} onChange={(paths) => setF({ ...f, evidence: paths })} /></div>
        <div className="flex gap-2 md:col-span-2"><button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button><button type="button" onClick={onClose} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button></div>
      </form>
    </ScreenModal>
  );
}
