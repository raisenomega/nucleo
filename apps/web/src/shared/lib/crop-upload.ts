import { supabase } from "@shared/lib/supabase";
import type { Crop } from "react-image-crop";

// Recorta la imagen a WebP (según crop en %), la sube a landing-assets/{tenant}/{entityType}/{uuid}.webp
// y devuelve la URL pública. maxWidth acota el ancho final.
export async function cropToWebpAndUpload(
  img: HTMLImageElement, crop: Crop, tenantId: string, entityType: string, maxWidth = 1920,
): Promise<string | null> {
  const sx = (crop.x / 100) * img.naturalWidth, sy = (crop.y / 100) * img.naturalHeight;
  const sw = (crop.width / 100) * img.naturalWidth, sh = (crop.height / 100) * img.naturalHeight;
  const scale = Math.min(1, maxWidth / sw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale); canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));
  if (!blob) return null;
  const path = `${tenantId}/${entityType}/${crypto.randomUUID()}.webp`;
  const up = await supabase.storage.from("landing-assets").upload(path, blob, { contentType: "image/webp", upsert: true });
  if (up.error) return null;
  return supabase.storage.from("landing-assets").getPublicUrl(path).data.publicUrl;
}

// Sube un archivo tal cual (video u otro) sin recorte → landing-assets/{tenant}/{entityType}/{uuid}.{ext}.
export async function uploadRawMedia(file: File, tenantId: string, entityType: string): Promise<string | null> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${tenantId}/${entityType}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("landing-assets").upload(path, file, { contentType: file.type, upsert: true });
  if (up.error) return null;
  return supabase.storage.from("landing-assets").getPublicUrl(path).data.publicUrl;
}
