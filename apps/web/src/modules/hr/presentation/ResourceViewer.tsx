import { useEffect, useState } from "react";
import { ExternalLink, Download } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { VideoEmbed } from "@shared/components/VideoEmbed";
import { formatBytes } from "@hr/presentation/res-ui";
import type { Resource } from "@hr/domain/resource.types";

// Muestra el recurso según su tipo. Los archivos se firman al abrir (signed URL 1h); video embebido inline.
export function ResourceViewer({ res, sign, onClose }: {
  res: Resource; sign: (path: string) => Promise<string | null>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { if (res.fileUrl) void sign(res.fileUrl).then(setUrl); }, [res.fileUrl, sign]);
  const linkBtn = (href: string, label: string, Icon: typeof ExternalLink) => (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
      <Icon className="h-4 w-4" /> {label}</a>);
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{res.title}</h2>
        {res.resourceType === "video" && res.videoUrl && <VideoEmbed url={res.videoUrl} title={res.title} />}
        {res.resourceType === "link" && res.externalUrl && linkBtn(res.externalUrl, t("openLink"), ExternalLink)}
        {res.resourceType === "image" && url && <img src={url} alt={res.title} className="max-h-[70vh] w-full rounded-lg object-contain" />}
        {res.resourceType === "document" && url && <iframe src={url} title={res.title} className="h-[70vh] w-full rounded-lg border border-border" />}
        {res.resourceType === "presentation" && (url ? linkBtn(url, `${t("download")} · ${formatBytes(res.fileSize)}`, Download) : <p className="text-sm text-muted-foreground">…</p>)}
        {res.description && <p className="text-sm text-muted-foreground">{res.description}</p>}
        {res.tags.length > 0 && <div className="flex flex-wrap gap-1">{res.tags.map((g) => <span key={g} className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">#{g}</span>)}</div>}
        <div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("close")}</button></div>
      </div>
    </ScreenModal>
  );
}
