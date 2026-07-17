import { useState } from "react";
import { Camera } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { uploadEvidence } from "@finance/infrastructure/supabase-evidence.storage";

const MAX = 3;

export function EvidenceUpload({ tenantId, value, onChange }: {
  tenantId: string; value: readonly string[]; onChange: (paths: string[]) => void;
}) {
  const { t } = useI18n();
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX - value.length);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    const paths = await uploadEvidence(tenantId, files);
    setPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
    onChange([...value, ...paths]);
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-body ${value.length >= MAX ? "pointer-events-none opacity-50" : ""}`}>
        <Camera className="h-4 w-4" /> {busy ? "…" : t("addEvidence")} ({value.length}/{MAX})
        <input type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={onPick} />
      </label>
      {previews.length > 0 && (
        <div className="flex gap-2">
          {previews.map((src, i) => <img key={i} src={src} alt="" className="h-14 w-14 rounded object-cover" />)}
        </div>
      )}
    </div>
  );
}
