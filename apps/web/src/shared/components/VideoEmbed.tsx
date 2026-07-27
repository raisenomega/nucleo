import { ExternalLink } from "lucide-react";
import { getVideoEmbedUrl } from "@shared/lib/video-embed";

// Embebe el video inline (16:9) según el provider detectado. Si la URL no se reconoce,
// cae a un link clickable — nunca redirige por su cuenta.
export function VideoEmbed({ url, title }: { url: string; title?: string }) {
  const embed = getVideoEmbedUrl(url);
  if (!embed) return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary underline">
      <ExternalLink className="h-4 w-4" /> {title ?? url}</a>
  );
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
      <iframe src={embed} title={title ?? "video"} className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
    </div>
  );
}
