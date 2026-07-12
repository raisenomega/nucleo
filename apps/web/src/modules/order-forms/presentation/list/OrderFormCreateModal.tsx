import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";

export function OrderFormCreateModal({ busy, onCreate, onClose }: {
  busy: boolean; onCreate: (name: string, description: string) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("ofCreateTitle")}</h2>
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("ofName")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={fld} /></label>
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("ofDescription")}</span>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} className={fld} /></label>
        <div className="flex gap-2">
          <button type="button" disabled={busy || name.trim().length < 3} onClick={() => onCreate(name.trim(), desc.trim())}
            className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("ofCreate")}</button>
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-foreground">{t("cancel")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
