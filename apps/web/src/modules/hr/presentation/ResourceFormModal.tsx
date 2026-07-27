import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { ResourceFormFields } from "@hr/presentation/ResourceFormFields";
import { RES_TYPES, RES_KEY } from "@hr/presentation/res-ui";
import type { ResourceInput, ResourceType, ResResult } from "@hr/domain/resource.types";

// Crea un recurso. Si es archivo, sube primero a training-media (carpeta uuid) y guarda el path en file_url.
export function ResourceFormModal({ tenantId, onCreate, upload, onClose }: {
  tenantId: string; onCreate: (i: ResourceInput) => Promise<ResResult>;
  upload: (id: string, file: File) => Promise<string | null>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [type, setType] = useState<ResourceType>("document");
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  const [category, setCategory] = useState(""); const [tags, setTags] = useState(""); const [isPublic, setIsPublic] = useState(true);
  const [file, setFile] = useState<File | null>(null); const [videoUrl, setVideoUrl] = useState(""); const [externalUrl, setExternalUrl] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const isFileType = type === "document" || type === "image" || type === "presentation";
  async function submit() {
    if (!title.trim()) { setErr(t("requiredFields")); return; }
    setBusy(true); setErr("");
    const base: ResourceInput = { title: title.trim(), description, resourceType: type, category, isPublic,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean), videoUrl: videoUrl || null, externalUrl: externalUrl || null };
    if (isFileType) {
      if (!file) { setErr(t("requiredFields")); setBusy(false); return; }
      const path = await upload(crypto.randomUUID(), file);
      if (!path) { setErr(t("uploadFile")); setBusy(false); return; }
      base.fileUrl = path; base.fileName = file.name; base.fileSize = file.size; base.fileMime = file.type;
    }
    const r = await onCreate(base); setBusy(false);
    if (r.ok) onClose(); else setErr(r.error);
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("addResource")}</h2>
        <select value={type} onChange={(e) => setType(e.target.value as ResourceType)} className={fld}>{RES_TYPES.map((x) => <option key={x} value={x}>{t(RES_KEY[x])}</option>)}</select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("title")} className={fld} />
        <ResourceFormFields type={type} file={file} setFile={setFile} videoUrl={videoUrl} setVideoUrl={setVideoUrl} externalUrl={externalUrl} setExternalUrl={setExternalUrl} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("description")} rows={2} className={fld} />
        <div className="grid grid-cols-2 gap-2">
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("category")} className={fld} />
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("tags")} className={fld} />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> {t("visibleToEmployees")}</label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" disabled={busy} onClick={() => void submit()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("save")}</button></div>
      </div>
    </ScreenModal>
  );
}
