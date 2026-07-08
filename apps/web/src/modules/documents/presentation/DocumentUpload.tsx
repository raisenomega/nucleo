import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { DOC_CATEGORIES, DOC_CAT_KEY } from "@documents/presentation/doc-ui";
import type { DocCategory, DocInput, DocResult } from "@documents/domain/document.types";

const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function DocumentUpload({ tenantId, onUpload, onSubmit, onCancel }: {
  tenantId: string;
  onUpload: (tenantId: string, file: File) => Promise<{ path: string; name: string } | null>;
  onSubmit: (d: DocInput) => Promise<DocResult>; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocCategory>("contract");
  const [file, setFile] = useState<File | null>(null);
  const [parties, setParties] = useState("");
  const [effective, setEffective] = useState("");
  const [expiration, setExpiration] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!title.trim() || !file) return;
    setBusy(true);
    const up = await onUpload(tenantId, file);
    if (!up) { setBusy(false); window.alert(t("uploadDoc")); return; }
    const r = await onSubmit({ title: title.trim(), category, description: "", fileUrl: up.path, fileName: up.name,
      parties: split(parties), effectiveDate: effective || null, expirationDate: expiration || null, reminderDays: 30, tags: split(tags) });
    setBusy(false);
    if (!r.ok) window.alert(r.error); else onCancel();
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-3 rounded-lg border border-border bg-card p-5">
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("docTitle")} className={fld} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <select value={category} onChange={(e) => setCategory(e.target.value as DocCategory)} className={fld}>
          {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{t(DOC_CAT_KEY[c])}</option>)}</select>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={fld} />
        <input value={parties} onChange={(e) => setParties(e.target.value)} placeholder={t("parties")} className={fld} />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("tags")} className={fld} />
        <label className="space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("effectiveDate")}</span>
          <input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} className={fld} /></label>
        <label className="space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("expirationDate")}</span>
          <input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} className={fld} /></label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{busy ? t("uploadDoc") : t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
