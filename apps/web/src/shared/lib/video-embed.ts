// Video provider-agnóstico: hoy YouTube (unlisted), mañana Bunny Stream sin tocar schema ni UI.
// El campo guarda la URL cruda; estos helpers derivan el embed + el provider.
export type VideoProvider = "youtube" | "vimeo" | "bunny" | "other";

// Devuelve la URL de embed (iframe src) o null si no se reconoce el provider.
export function getVideoEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  const bn = url.match(/iframe\.mediadelivery\.net\/embed\/(\d+)\/([\w-]+)/);
  if (bn) return url;
  const bnAlt = url.match(/video\.bunnycdn\.com\/play\/(\d+)\/([\w-]+)/);
  if (bnAlt) return `https://iframe.mediadelivery.net/embed/${bnAlt[1]}/${bnAlt[2]}`;
  return null;
}

export function getVideoProvider(url: string): VideoProvider {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/vimeo\.com/.test(url)) return "vimeo";
  if (/bunnycdn|mediadelivery\.net/.test(url)) return "bunny";
  return "other";
}
