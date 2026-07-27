import { useI18n } from "@shared/i18n";
import { VideoEmbed } from "@shared/components/VideoEmbed";
import { getVideoEmbedUrl } from "@shared/lib/video-embed";
import { formatBytes } from "@hr/presentation/res-ui";
import type { ResourceType } from "@hr/domain/resource.types";

const ACCEPT: Partial<Record<ResourceType, string>> = {
  document: ".pdf,.doc,.docx", image: "image/png,image/jpeg,image/gif,image/webp",
  presentation: ".ppt,.pptx", // hasta 50MB
};

// Campos específicos por tipo: upload (doc/img/present), URL de video con preview, o URL de link.
export function ResourceFormFields({ type, file, setFile, videoUrl, setVideoUrl, externalUrl, setExternalUrl }: {
  type: ResourceType; file: File | null; setFile: (f: File | null) => void;
  videoUrl: string; setVideoUrl: (v: string) => void; externalUrl: string; setExternalUrl: (v: string) => void;
}) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  if (type === "video") return (
    <div className="space-y-2">
      <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=… o https://youtu.be/…" className={fld} />
      {videoUrl && (getVideoEmbedUrl(videoUrl) ? <VideoEmbed url={videoUrl} title={t("videoPreview")} />
        : <p className="text-xs font-bold text-amber-600">{t("urlNotRecognized")}</p>)}
    </div>);
  if (type === "link") return (
    <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://…" className={fld} />);
  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
        <input type="file" accept={ACCEPT[type]} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {file ? `${file.name} · ${formatBytes(file.size)}` : t("dragOrClick")}</label>
      {file && type === "image" && <img src={URL.createObjectURL(file)} alt="" className="max-h-40 rounded-lg object-contain" />}
      <p className="text-xs text-muted-foreground">{t("maxFileSize")}</p>
    </div>);
}
