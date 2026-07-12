import { ArrowLeft } from "lucide-react";
import { useI18n } from "@shared/i18n";

export function EditorToolbar({ name, onName, dirty, busy, onSave, onClose }: {
  name: string; onName: (v: string) => void; dirty: boolean; busy: boolean; onSave: () => void; onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 border-b border-border p-3">
      <button type="button" onClick={onClose} aria-label={t("cancel")}><ArrowLeft className="h-5 w-5" /></button>
      <input value={name} onChange={(e) => onName(e.target.value)} className="flex-1 rounded-lg border border-border bg-background p-2 text-sm font-bold text-foreground" />
      {dirty && <span className="hidden text-xs text-amber-600 sm:inline dark:text-amber-400">{t("ofUnsaved")}</span>}
      <button type="button" disabled={busy || !dirty} onClick={onSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("save")}</button>
    </div>
  );
}
