import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { ScreenModal } from "@shared/components/ScreenModal";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import { supabaseAssetRepository } from "@assets/infrastructure/supabase-asset.repository";
import { FUEL } from "@assets/presentation/asset-labels";
import type { CheckinData } from "@assets/domain/asset.types";

// Checkin: devolución — odómetro/millas (auto)/gasolina/ruta/paradas/carga/condición/fotos.
export function CheckinModal({ assetId, assetName, onSubmit, onClose }: {
  assetId: string; assetName: string; onSubmit: (d: CheckinData) => void; onClose: () => void;
}) {
  const { t } = useI18n(); const { session } = useSession();
  const [f, setF] = useState<CheckinData>({ odometer: null, fuelLevel: "half", gallons: null, route: "", stops: null, cargo: "", condition: "", notes: "", evidence: [] });
  const [last, setLast] = useState<number | null>(null);
  useEffect(() => { void supabaseAssetRepository.listCustody(assetId).then((logs) => setLast(logs.find((l) => l.custodyType === "checkout")?.odometer ?? null)); }, [assetId]);
  const miles = f.odometer != null && last != null ? f.odometer - last : null;
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm"; const lbl = "text-xs font-bold text-muted-foreground";
  const go = (e: React.FormEvent) => { e.preventDefault(); onSubmit(f); };
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("receiveCheckin")} · {assetName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={go} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        <label className="space-y-1"><span className={lbl}>{t("odometer")}</span><input type="number" min="0" value={f.odometer ?? ""} onChange={(e) => setF({ ...f, odometer: e.target.value ? Number(e.target.value) : null })} className={fld} required /></label>
        <div className="space-y-1"><span className={lbl}>{t("milesTraveled")}</span><p className={`rounded-lg border border-border p-2 text-sm ${miles != null && miles < 0 ? "text-destructive" : "font-semibold"}`}>{miles ?? "—"}</p></div>
        <label className="space-y-1"><span className={lbl}>{t("fuelLevel")}</span><select value={f.fuelLevel} onChange={(e) => setF({ ...f, fuelLevel: e.target.value })} className={fld}>{FUEL.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}</select></label>
        <label className="space-y-1"><span className={lbl}>{t("gallons")}</span><input type="number" min="0" step="0.01" value={f.gallons ?? ""} onChange={(e) => setF({ ...f, gallons: e.target.value ? Number(e.target.value) : null })} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("stopsCount")}</span><input type="number" min="0" value={f.stops ?? ""} onChange={(e) => setF({ ...f, stops: e.target.value ? Number(e.target.value) : null })} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("notes")}</span><input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={fld} /></label>
        <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("routeSummary")}</span><textarea value={f.route} onChange={(e) => setF({ ...f, route: e.target.value })} rows={2} className={fld} /></label>
        <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("cargoDescription")}</span><input value={f.cargo} onChange={(e) => setF({ ...f, cargo: e.target.value })} className={fld} /></label>
        <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("conditionNotes")}</span><input value={f.condition} onChange={(e) => setF({ ...f, condition: e.target.value })} className={fld} /></label>
        <div className="space-y-1 md:col-span-2"><span className={lbl}>{t("returnPhotos")}</span><EvidenceUpload tenantId={session?.tenantId ?? ""} value={f.evidence} onChange={(paths) => setF({ ...f, evidence: paths })} /></div>
        <div className="flex gap-2 md:col-span-2"><button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button><button type="button" onClick={onClose} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button></div>
      </form>
    </ScreenModal>
  );
}
