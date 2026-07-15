import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export function ServicePageCreateModal({ onCreate, onClose }: {
  onCreate: (slug: string, es: string, en: string, sub: string) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [es, setEs] = useState(""); const [en, setEn] = useState(""); const [slug, setSlug] = useState(""); const [sub, setSub] = useState(""); const [touched, setTouched] = useState(false);
  const finalSlug = touched ? slug : slugify(es);
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4"><h2 className="font-bold text-foreground">{t("spCreate")}</h2><button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button></div>
      <div className="space-y-3 p-4">
        <input value={es} onChange={(e) => setEs(e.target.value)} placeholder={`${t("spTitleEs")} *`} className={fld} />
        <input value={en} onChange={(e) => setEn(e.target.value)} placeholder={t("spTitleEn")} className={fld} />
        <input value={finalSlug} onChange={(e) => { setTouched(true); setSlug(slugify(e.target.value)); }} placeholder="slug" className={`${fld} font-mono`} />
        <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder={t("spSubtitle")} className={fld} />
        <button type="button" disabled={es.trim().length < 3 || !finalSlug} onClick={() => onCreate(finalSlug, es, en, sub)} className="w-full rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{t("save")}</button>
      </div>
    </ScreenModal>
  );
}
