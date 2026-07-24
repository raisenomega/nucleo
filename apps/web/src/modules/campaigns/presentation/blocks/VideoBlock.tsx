import type { BlockContent } from "@campaigns/domain/campaign.types";

const s = (c: BlockContent, k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");

// YouTube/Vimeo → iframe embebido; URL directa (.mp4) → <video>. 16:9 responsive. Autoplay siempre muted (browsers).
function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export function VideoBlock({ content }: { content: BlockContent }) {
  const url = s(content, "video_url");
  if (!url) return null;
  const embed = embedUrl(url);
  const autoplay = content.autoplay === true || content.autoplay === "1";
  return (
    <section className="camp-video"><div className="camp-video-frame">
      {embed
        ? <iframe src={embed + (autoplay ? "?autoplay=1&mute=1" : "")} title="Video" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        : <video src={url} poster={s(content, "poster_url") || undefined} controls muted={autoplay} autoPlay={autoplay} playsInline />}
    </div></section>
  );
}
