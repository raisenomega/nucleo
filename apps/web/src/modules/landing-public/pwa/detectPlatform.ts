// Detección de plataforma para PWA. Chrome/Firefox/Edge en iOS son webkit y NO instalan PWA → 'other' (botón oculto).
export function getPlatform(): "chromium" | "ios-safari" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
  if (isIOS) return /CriOS|FxiOS|EdgiOS/.test(ua) ? "other" : "ios-safari";
  if (/Chrome|Edg|Android/.test(ua)) return "chromium";
  return "other";
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as { standalone?: boolean }).standalone === true;
}
