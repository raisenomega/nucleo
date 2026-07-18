import { useI18n } from "@shared/i18n";
import type { SupplierFormData } from "@fieldops/domain/supplier.types";

const TYPES = ["Distribuidor", "Fabricante", "Importador", "Mayorista", "Minorista", "Freelancer", "Otro"];
const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
const lbl = "text-xs font-bold text-muted-foreground";
const sec = "col-span-full border-t border-border pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground";

// Secciones 1-3 del proveedor: general, contacto, redes. Recibe f + set (DI del SupplierForm).
export function SupplierFieldsA({ f, set }: { f: SupplierFormData; set: (p: Partial<SupplierFormData>) => void }) {
  const { t } = useI18n();
  const txt = (k: keyof SupplierFormData, label: string, type = "text") => (
    <label className="space-y-1"><span className={lbl}>{label}</span>
      <input type={type} value={(f[k] as string) ?? ""} onChange={(e) => set({ [k]: e.target.value } as Partial<SupplierFormData>)} className={fld} /></label>
  );
  return (
    <>
      <p className={sec}>{t("secGeneral")}</p>
      <label className="space-y-1"><span className={lbl}>{t("name")}</span><input value={f.name} onChange={(e) => set({ name: e.target.value })} className={fld} required /></label>
      <label className="space-y-1"><span className={lbl}>{t("companyType")}</span>
        <select value={f.companyType} onChange={(e) => set({ companyType: e.target.value })} className={fld}><option value="">—</option>{TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
      <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("description")}</span><textarea value={f.description} onChange={(e) => set({ description: e.target.value })} rows={2} className={fld} /></label>
      {txt("primaryCategory", t("primaryCategory"))}
      <label className="space-y-1"><span className={lbl}>{t("secondaryCategories")}</span><input value={f.secondaryCategories.join(", ")} onChange={(e) => set({ secondaryCategories: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} className={fld} /></label>
      {txt("website", t("website"), "url")}{txt("catalogUrl", t("catalogUrl"), "url")}
      <p className={sec}>{t("contactInfo")}</p>
      {txt("contactName", t("contactName"))}{txt("phone", t("phone"), "tel")}{txt("email", t("email"), "email")}{txt("whatsapp", t("whatsapp"), "tel")}
      {txt("address", t("address"))}{txt("city", t("city"))}{txt("state", t("stateProvince"))}{txt("zipCode", t("zip"))}{txt("country", t("country"))}
      <p className={sec}>{t("socialSection")}</p>
      {txt("facebook", "Facebook", "url")}{txt("instagram", "Instagram")}{txt("linkedin", "LinkedIn", "url")}
    </>
  );
}
