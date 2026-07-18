import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { CategoryPicker } from "@shared/components/CategoryPicker";
import { ImageUploadWithCrop } from "@shared/components/ImageUploadWithCrop";
import type { TranslationKey } from "@shared/i18n";
import { ASSET_TYPE, CONDITION, STATUS } from "@assets/presentation/asset-labels";
import type { AssetFormData, ProfileRef, AssetType, AssetCondition, AssetStatus } from "@assets/domain/asset.types";

const EMPTY: AssetFormData = { name: "", assetType: "equipment", category: "", serialNumber: "", model: "", brand: "", purchaseDate: null, purchasePrice: null, currentValue: null, depreciationMethod: "none", depreciationYears: null, warrantyExpires: null, condition: "good", status: "active", assignedTo: null, location: "", insurancePolicy: "", insuranceExpires: null, notes: "", imageUrl: "", active: true, gpsEnabled: false, gpsDeviceId: "", gpsProvider: "" };
type StrKey = "category" | "serialNumber" | "model" | "brand" | "location" | "insurancePolicy" | "imageUrl";
type NumKey = "purchasePrice" | "currentValue" | "depreciationYears";
type DateKey = "purchaseDate" | "warrantyExpires" | "insuranceExpires";

export function AssetForm({ initial, profiles, onSubmit, onCancel }: {
  initial?: AssetFormData; profiles: readonly ProfileRef[]; onSubmit: (d: AssetFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n(); const { can } = useModuleAccess();
  const [f, setF] = useState<AssetFormData>(initial ?? EMPTY);
  const set = (p: Partial<AssetFormData>) => setF((c) => ({ ...c, ...p }));
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm"; const lbl = "text-xs font-bold text-muted-foreground";
  const sec = "col-span-full border-t border-border pt-3 text-xs font-bold uppercase text-muted-foreground";
  const txt = (k: StrKey, key: TranslationKey) => (<label className="space-y-1"><span className={lbl}>{t(key)}</span><input value={f[k]} onChange={(e) => set({ [k]: e.target.value } as Partial<AssetFormData>)} className={fld} /></label>);
  const num = (k: NumKey, key: TranslationKey) => (<label className="space-y-1"><span className={lbl}>{t(key)}</span><input type="number" min="0" step="0.01" value={f[k] ?? ""} onChange={(e) => set({ [k]: e.target.value ? Number(e.target.value) : null } as Partial<AssetFormData>)} className={fld} /></label>);
  const dt = (k: DateKey, key: TranslationKey) => (<label className="space-y-1"><span className={lbl}>{t(key)}</span><input type="date" value={f[k] ?? ""} onChange={(e) => set({ [k]: e.target.value || null } as Partial<AssetFormData>)} className={fld} /></label>);
  const go = (e: React.FormEvent) => { e.preventDefault(); if (!f.name.trim()) return; onSubmit(f); };
  return (
    <form onSubmit={go} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold">{t("newAsset")}</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <p className={sec}>{t("secGeneral")}</p>
        <div className="md:col-span-2"><ImageUploadWithCrop entityType="asset" aspectRatio={16 / 9} value={f.imageUrl || null} onUploaded={(url) => set({ imageUrl: url ?? "" })} /></div>
        <label className="space-y-1"><span className={lbl}>{t("name")}</span><input value={f.name} onChange={(e) => set({ name: e.target.value })} className={fld} required /></label>
        <label className="space-y-1"><span className={lbl}>{t("assetType")}</span><select value={f.assetType} onChange={(e) => set({ assetType: e.target.value as AssetType })} className={fld}>{Object.keys(ASSET_TYPE).map((k) => <option key={k} value={k}>{t(ASSET_TYPE[k as AssetType])}</option>)}</select></label>
        <CategoryPicker kind="asset_type" value={f.category} onChange={(v) => set({ category: v })} label="category" byLabel />
        {txt("brand", "brand")}{txt("model", "model")}{txt("serialNumber", "serialNumber")}
        <p className={sec}>{t("secPurchase")}</p>
        {dt("purchaseDate", "purchaseDate")}{can("assets", "cost") && num("purchasePrice", "purchasePrice")}{can("assets", "cost") && num("currentValue", "currentValue")}
        <label className="space-y-1"><span className={lbl}>{t("depMethod")}</span><select value={f.depreciationMethod} onChange={(e) => set({ depreciationMethod: e.target.value })} className={fld}><option value="none">{t("depNone")}</option><option value="straight_line">{t("depStraight")}</option></select></label>
        {num("depreciationYears", "depYears")}
        <p className={sec}>{t("secAssignment")}</p>
        <label className="space-y-1"><span className={lbl}>{t("status")}</span><select value={f.status} onChange={(e) => set({ status: e.target.value as AssetStatus })} className={fld}>{Object.keys(STATUS).map((k) => <option key={k} value={k}>{t(STATUS[k as AssetStatus].key)}</option>)}</select></label>
        <label className="space-y-1"><span className={lbl}>{t("condition")}</span><select value={f.condition} onChange={(e) => set({ condition: e.target.value as AssetCondition })} className={fld}>{Object.keys(CONDITION).map((k) => <option key={k} value={k}>{t(CONDITION[k as AssetCondition])}</option>)}</select></label>
        <label className="space-y-1"><span className={lbl}>{t("assignedTo")}</span><select value={f.assignedTo ?? ""} onChange={(e) => set({ assignedTo: e.target.value || null })} className={fld}><option value="">— {t("unassigned")} —</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        {txt("location", "location")}
        <p className={sec}>{t("secInsurance")}</p>
        {dt("warrantyExpires", "warrantyExpires")}{txt("insurancePolicy", "insurancePolicy")}{dt("insuranceExpires", "insuranceExpires")}
        <p className={sec}>{t("secGps")}</p>
        <label className="flex items-center gap-2 md:col-span-2"><input type="checkbox" checked={f.gpsEnabled} onChange={(e) => set({ gpsEnabled: e.target.checked })} /><span className={lbl}>{t("gpsEnabled")}</span></label>
        {f.gpsEnabled && <label className="space-y-1"><span className={lbl}>{t("gpsDeviceId")}</span><input value={f.gpsDeviceId} onChange={(e) => set({ gpsDeviceId: e.target.value })} className={fld} /></label>}
        {f.gpsEnabled && <label className="space-y-1"><span className={lbl}>{t("gpsProvider")}</span><input value={f.gpsProvider} onChange={(e) => set({ gpsProvider: e.target.value })} className={fld} placeholder="Samsara / Geotab" /></label>}
        <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("notes")}</span><input value={f.notes} onChange={(e) => set({ notes: e.target.value })} className={fld} /></label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
      </div>
    </form>
  );
}
