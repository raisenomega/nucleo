import { useEffect } from "react";
import type { ProductFull } from "@landing-public/domain/landing-product-detail.types";

function setMeta(key: string, content: string, attr = "name") {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
}

// SEO client-side (SSR real = follow-up): document.title + meta description + Open Graph.
export function useProductSeo(p?: ProductFull) {
  useEffect(() => {
    if (!p) return;
    const title = p.meta_title || p.name;
    const desc = p.meta_description || p.short_description || "";
    document.title = title;
    setMeta("description", desc);
    setMeta("og:title", title, "property");
    setMeta("og:description", desc, "property");
    if (p.primary_image_url) setMeta("og:image", p.primary_image_url, "property");
  }, [p]);
}
