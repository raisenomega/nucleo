import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { FB_TYPES, FB_KEY } from "@hr/presentation/fb-ui";
import type { FeedbackType, FbResult } from "@hr/domain/feedback.types";

type Emp = { id: string; full_name: string };

export function FeedbackForm({ employees, onSubmit, onCancel }: {
  employees: Emp[]; onSubmit: (target: string | null, type: FeedbackType, content: string, anon: boolean) => Promise<FbResult>; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [target, setTarget] = useState("");
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [content, setContent] = useState("");
  const [anon, setAnon] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!content.trim()) return;
    setBusy(true);
    const r = await onSubmit(target || null, type, content.trim(), anon);
    setBusy(false);
    if (!r.ok) window.alert(r.error); else onCancel();
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <select value={type} onChange={(e) => setType(e.target.value as FeedbackType)} className={fld}>
          {FB_TYPES.map((v) => <option key={v} value={v}>{t(FB_KEY[v])}</option>)}</select>
        <select value={target} onChange={(e) => setTarget(e.target.value)} className={fld}>
          <option value="">{t("fbGeneral")}</option>{employees.map((x) => <option key={x.id} value={x.id}>{x.full_name}</option>)}</select>
      </div>
      <textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("fbContent")} rows={3} className={fld} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> {t("anonymous")}</label>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("send")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
