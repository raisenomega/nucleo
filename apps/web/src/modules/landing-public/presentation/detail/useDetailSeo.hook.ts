import { useEffect } from "react";

function setMeta(key: string, content: string, attr = "name") {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
}

// SEO client-side (SSR real = follow-up): title + meta description + Open Graph. Genérico para las 3 detail pages.
export function useDetailSeo(title?: string, description?: string, image?: string | null) {
  useEffect(() => {
    if (!title) return;
    document.title = title;
    setMeta("description", description ?? "");
    setMeta("og:title", title, "property");
    setMeta("og:description", description ?? "", "property");
    if (image) setMeta("og:image", image, "property");
  }, [title, description, image]);
}
